export function getDataModel(connection) {
  const dataSchema = new connection.Schema({
    filePath: String,
    fileName: String,
  });
  //to handle the __V and _id parameters from mongoDB
  dataSchema.set("toJSON", {
    transform: (document, returnedObject) => {
      console.log("working format");
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
      delete returnedObject.__v;
    },
  });
  return connection.model("data", dataSchema);
}
