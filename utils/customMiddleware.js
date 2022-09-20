export const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  console.log(new Date()); //log the time of the request
  next();
};
export const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};
