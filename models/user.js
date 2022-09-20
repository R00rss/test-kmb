export function getUserModel(connection) {
  const userSchema = new connection.Schema({
    name: String,
  });
  //to handle the __V and _id parameters from mongoDB
  userSchema.set("toJSON", {
    transform: (document, returnedObject) => {
      console.log("working format");
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
      delete returnedObject.__v;
    },
  });
  return connection.model("users", userSchema);
}
