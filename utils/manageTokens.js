import jwt from "jsonwebtoken";

export function parseJwt(token) {
  try {
    const originalInfo = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return originalInfo;
  } catch (error) {
    console.log("error en el token indicado", error);
    return { error: error, message: "No es un token valido" };
  }
}

export function decodeToken(token, secret_key) {
  return jwt.verify(token, secret_key);
}
export function encodeToken(content, secret_key) {
  return jwt.sign(content, secret_key);
}
