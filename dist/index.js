import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { userRoutes } from "./routes/user.js";
import { authRoutes } from "./routes/auth.js";
import { jwt } from "hono/jwt";
const JWT_SECRET = process.env.JWT_SECRET ?? "xixi";
const app = new Hono();
app.use("/users/*", jwt({
    secret: JWT_SECRET,
    alg: "HS256",
}));
app.route("/users", userRoutes);
app.route("/auth", authRoutes);
app.get("/", (c) => {
    return c.json({
        status: "ok",
    });
});
serve({
    fetch: app.fetch,
    port: 3000,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
