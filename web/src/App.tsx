import axios from "axios"
import { FormEvent, useState } from "react"


function App() {
  const [files, setFiles] = useState<FileList | null>(null)

  async function handleUploadFile(e: FormEvent) {
    e.preventDefault()

    if (!files || files.length === 0) {
      return
    }

    const file = files[0]

    const data = {
      name: 'profile-linkedin.jpeg',
      contentType: 'image/jpeg'
    };

    const response = await axios.post('http://localhost:3333/uploads', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log(response)

    await axios.put(response.data.signedUrl, file, {
      headers: {
        'Content-Type': 'image/jpeg'
      }
    })

  }

  return (
    <form onSubmit={handleUploadFile}>
      <input type="file" name="file" onChange={e => setFiles(e.target.files)} />
      <button type="submit">Upload</button>
    </form>
  )
}

export default App
