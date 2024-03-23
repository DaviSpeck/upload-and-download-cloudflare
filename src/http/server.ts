import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { r2 } from '../lib/cloudflare';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const app = fastify()
app.register(cors, {
    origin: '*'
})

const prisma = new PrismaClient()

// Returns a signed url so that the front-end can upload directly to cloudflare storage
app.post('/uploads', async (request) => {
    const uploadBodySchema = z.object({
        name: z.string().min(1),
        contentType: z.string().regex(/\w+\/[-+.\w]+/)
    })

    const { name, contentType } = uploadBodySchema.parse(request.body)

    const fileKey = randomUUID().concat('-').concat(name)

    const signedUrl = await getSignedUrl(
        r2,
        new PutObjectCommand({
            Bucket: 'app-upload-download-archives',
            Key: fileKey,
            ContentType: contentType
        }),
        { expiresIn: 600 }
    )

    const file = await prisma.file.create({
        data: {
            name,
            contentType,
            key: fileKey
        }
    })

    return { signedUrl, fileId: file.id }
})

/*
    Example of request in front with CURL:
    curl -X PUT \
        --data-binary "@file.jpeg" \
        -H "Content-Type: image/jpeg" \
        "SIGNED_URL"
*/

app.get('/uploads/:id', async (request) => {
    const getFileParamsSchema = z.object({
        id: z.string().cuid()
    })

    const { id } = getFileParamsSchema.parse(request.params)

    const file = await prisma.file.findUniqueOrThrow({
        where: {
            id
        }
    })

    const signedUrl = await getSignedUrl(
        r2,
        new GetObjectCommand({
            Bucket: 'app-upload-download-archives',
            Key: file.key,
        }),
        { expiresIn: 600 }
    )

    return { signedUrl }
})

app.listen({
    port: 3333,
    host: '0.0.0.0',
}).then(() => {
    console.log('HTTP server running!')
})