const http = require("http");
const { parse: parseUrl } = require("url");

//data fake
let posts = [
  { id: 1, titre: "Hello ESIG", descrption: "Premier post de démonstration", date: "2026-03-20" },
  { id: 2, titre: "Sortie TP", descrption: "On avance doucement mais sûrement", date: "2026-03-22" },
  { id: 3, titre: "Astuce REST", descrption: "GET pour lire, POST pour créer, PUT pour mettre à jour, DEL pour supprimer", date: "2026-03-25" },
];

// auto increment id
let nextId = posts.length + 1;

//function to send json response
function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("Payload trop volumineux"));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("JSON invalide"));
      }
    });
    req.on("error", reject);
  });
}


const server = http.createServer(async (req, res) => {
  const { pathname } = parseUrl(req.url || "", true);
  try {
    // --- GET /posts ---
    if (req.method === "GET" && pathname === "/posts") {
      return sendJson(res, 200, { posts });
    }

    // --- POST /posts ---
    if (req.method === "POST" && pathname === "/posts") {
      const { titre, descrption, date } = await readJsonBody(req);

      const post = { id: nextId++, titre: titre.trim(), descrption: descrption.trim(), date: date.trim() };
      posts.push(post);
      return sendJson(res, 201, { post });
    }

    // --- PUT /posts ---
    if (req.method === "PUT" && pathname === "/posts") {
      const { id, titre, descrption, date } = await readJsonBody(req);

      // Vérifie que l'id existe
      const idx = posts.findIndex((p) => p.id === Number(id));
      if (idx === -1) {
        return sendJson(res, 404, { error: "Post introuvable" });
      }

      // Remplacement complet du contenu
      posts[idx] = {
        id: posts[idx].id,
        titre: titre.trim(),
        descrption: descrption.trim(),
        date: date.trim(),
      };

      return sendJson(res, 200, { post: posts[idx] });
    }

    // --- DELETE /posts/:id ---
    if (req.method === "DELETE") {
      const id = parseIdFromPath(pathname || "");
      if (id === null) {
        return sendJson(res, 404, { error: "Route inconnue" });
      }

      const idx = posts.findIndex((p) => p.id === id);
      if (idx === -1) {
        return sendJson(res, 404, { error: "Post introuvable" });
      }

      const [deleted] = posts.splice(idx, 1);
      return sendJson(res, 200, { deleted });
    }

    // Si méthode inconnue
    return sendJson(res, 404, { error: "Route inconnue" });
  } catch (err) {
    return sendJson(res, 400, { error: err.message || "Erreur" });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`API posts démarrée sur http://localhost:${PORT}/posts`);
});

