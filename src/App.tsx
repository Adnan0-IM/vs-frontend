import { Button } from "@/components/ui/button"
import axios from "axios"
import { useEffect, useState } from "react"

export function App() {
  const url = import.meta.env.VITE_API_BASE_URL
  const egDataUrl = `${url}/api-data`

  const [data, setData] = useState<DataT>({
    message: "",
    items: [],
  })
  type DataT = {
    message: string
    items: string[]
  }
  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(egDataUrl)
      setData(response.data)
      console.log(response.data)
    }
    void fetchData()
  }, [egDataUrl])

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div>
          <h3>This is from Backend api</h3>
          <p>{data.message}</p>
          {data.items.map((item) => (
            <li>{item}</li>
          ))}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
