import { createInterface } from "readline";
import * as stytch from "stytch";

const client = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID || "",
  secret: process.env.STYTCH_SECRET || "",
  env: process.env.STYTCH_API_URL,
});

const getUserInput = (query: string): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};
export async function authStytch() {
  const email = await getUserInput("Enter your email: ");
  const emailLoginOrCreateResponse = await client.otps.email.loginOrCreate({
    email: email,
  });
  const otp = await getUserInput("Enter your OTP: ");
  return await client.otps.authenticate({
    code: otp,
    method_id: emailLoginOrCreateResponse.email_id,
    session_duration_minutes: 5,
  });
}
