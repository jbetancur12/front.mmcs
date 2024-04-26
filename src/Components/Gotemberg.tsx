import axios from "axios";

const Gotemberg = () => {
  async function onFileInputChange(evt: any) {
    const formData = new FormData();
    const file = evt.target.files[0];
    formData.append("file", file);

    await axios.post(
      "http://localhost:3000/forms/libreoffice/convert",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  }
  return (
    <div>
      <label htmlFor="excelFileInput">Select an excel file</label>
      <input id="excelFileInput" type="file" onChange={onFileInputChange} />
    </div>
  );
};

export default Gotemberg;
