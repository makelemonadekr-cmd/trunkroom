import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { FavoritesProvider } from "./lib/favoritesStore.jsx";
import { LikesProvider }     from "./lib/likesContext.jsx";
import { FollowProvider }    from "./lib/followContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FavoritesProvider>
      <LikesProvider>
        <FollowProvider>
          <App />
        </FollowProvider>
      </LikesProvider>
    </FavoritesProvider>
  </StrictMode>
);
