/**
 * favoritesStore.jsx
 *
 * Global favorites state via React Context.
 * Wrap the app in <FavoritesProvider>; consume with useFavorites().
 *
 * Each favorite entry: { item, sourceType: "my_closet" | "other_closet" }
 * Keyed by item.id for O(1) lookup.
 * Designed so it can be replaced with a backend call later — swap
 * setFavorites with an async action and the consumers won't change.
 */

import { createContext, useContext, useState, useCallback } from "react";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  // { [itemId]: { item, sourceType } }
  const [favorites, setFavorites] = useState({});

  /**
   * Toggle favorite status for an item.
   * @param {object} item        — full item object (must have .id)
   * @param {"my_closet"|"other_closet"} sourceType
   */
  const toggleFavorite = useCallback((item, sourceType = "my_closet") => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = { item: { ...item, isFavorite: true, sourceType }, sourceType };
      }
      return next;
    });
  }, []);

  /** Returns true if item with given id is favorited */
  const isFavorite = useCallback((itemId) => !!favorites[itemId], [favorites]);

  const myClosetFavorites = Object.values(favorites)
    .filter((f) => f.sourceType === "my_closet")
    .map((f) => f.item);

  const otherClosetFavorites = Object.values(favorites)
    .filter((f) => f.sourceType === "other_closet")
    .map((f) => f.item);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        myClosetFavorites,
        otherClosetFavorites,
        totalCount: Object.keys(favorites).length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
