import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { userRoutes } from "./routes/user.js";

const app = new Hono();
app.route("/users", userRoutes);
app.get("/", (c) => {
  return c.json({
    status:'ok'
  })
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
