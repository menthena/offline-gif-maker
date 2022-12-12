import { ChangeEventHandler, useRef, useState } from "react";
import "./App.css";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

function App() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error>();
  const [videoSrc, setVideoSrc] = useState("");
  const ffmpeg = createFFmpeg({
    progress: ({ ratio }) => setProgress(ratio * 2),
  });

  const doTranscode: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const { target } = event;
    if (target) {
      const { files } = target;
      if (!files?.length) {
        return;
      }
      const { name } = files[0];
      setProgress(0);
      setVideoSrc("");
      setIsLoading(true);
      try {
        await ffmpeg.load();
        ffmpeg.FS("writeFile", name, await fetchFile(files[0]));
        await ffmpeg.run("-i", name, "-vf", "fps=24", "output.gif");
        const data = ffmpeg.FS("readFile", "output.gif");

        setVideoSrc(
          URL.createObjectURL(new Blob([data.buffer], { type: "image/gif" }))
        );
      } catch (e) {
        console.log(e);
        if (e instanceof Error) {
          setError(e);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const downloadImage = () => {
    const url = imageRef.current?.src;
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "gif.gif");

      // Append to html link element page
      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up and remove the link
      link.parentNode?.removeChild(link);
    }
  };
  return (
    <div className="App">
      <header>
        <h1>Offline Video to Gif</h1>
      </header>
      {videoSrc && (
        <>
          <img ref={imageRef} src={videoSrc} alt="" />
          <button className="button" onClick={downloadImage}>
            Download
          </button>
        </>
      )}
      <div className="file-input">
        <input
          type="file"
          id="file"
          className="file"
          onChange={doTranscode}
          accept="video/*"
        />
        <label htmlFor="file" className="button">
          Select file
        </label>
      </div>
      {isLoading && (
        <div className="loading">
          <span className="loader" />
          {progress.toFixed(2)}%
        </div>
      )}
      <br />
      {error && <p>{error.message}</p>}
    </div>
  );
}

export default App;
