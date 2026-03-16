# System Architecture Ideas: Web3 & Gen AI Integration

This document serves as a repository for advanced long-term architectural ideas discussed during the brainstorming session on 2026-03-16. These features are intended for future phases of the World Collide project, moving it beyond a local idle game into a dynamic, player-driven economy.

---

## 1. Web2.5 Architecture: The Dynamic Marketplace
Transitioning from static JSON data to a Database-Driven Architecture (MMO-lite) to support a living economy and potential NFT integration.

### Core Data Layers
*   **Layer 1: Master Data (The Immutable Template)**
    *   **Purpose:** Defines the base characteristics of items, characters, and structures.
    *   **Mechanism:** Stored securely on the backend (e.g., PostgreSQL/Supabase). E.g., `ITEM_001` is a "Wooden Sword" with base 5 ATK.
    *   **Benefit:** Allows Game Designers to globally balance (buff/nerf) items without requiring client-side patches.
*   **Layer 2: Instance Data (The Unique Object)**
    *   **Purpose:** Represents an actual item owned by a player.
    *   **Mechanism:** When a player acquires an item, a unique instance is created in their inventory database (e.g., `UUID: XYZ-123`, `TemplateId: ITEM_001`, `Durability: 90/100`).
    *   **Benefit:** Essential for trading, upgrading, and durability mechanics. Each item has a distinct identity.
*   **Layer 3: Dynamic Pricing (The Living Market)**
    *   **Purpose:** To simulate a real economy where prices fluctuate based on supply and demand.
    *   **Mechanism:** Instead of fixed prices, a dedicated `Market_Tickers` system (powered by backend workers) calculates prices periodically. If supply exceeds demand, NPC purchase prices drop natively.
    *   **Actionable Step:** Stop hardcoding prices. Abstract data fetch logic (e.g., `getItemPrice("SWORD_1")`) so it can be seamlessly switched from local JSON to an API call in the future.

---

## 2. On-Chain Integration: User-Driven NFT Minting
A strategy to allow true ownership of unique in-game assets without Burdening the developer with gas fees or complex blockchain infrastructure overhead.

### The "Export/Import" Model
1.  **In-Game Origin:** A player crafts or loots an exceptionally rare item ("Unique Item"). Initially, it exists solely in the Web2 PostgreSQL database, flagged as `isMintable = true`.
2.  **Export to Blockchain (Minting):**
    *   The player decides to tokenize the item to sell it on external marketplaces (e.g., OpenSea).
    *   The game UI prompts the player to connect their Web3 wallet (MetaMask/Phantom).
    *   The player initiates and **pays the gas fee** for the smart contract transaction (`mintItem()`).
    *   Upon confirmation, the game backend permanently locks or deletes the item from the player's Web2 inventory. The asset is now uncoupled from the game server.
3.  **Secondary Market Trading:** The player freely trades the NFT. The smart contract can include a Creator Royalty (e.g., 2%), providing passive revenue to the developers.
4.  **Import to Game:**
    *   The new owner of the NFT connects their wallet to the game.
    *   The game verifies ownership on-chain.
    *   The NFT is temporarily "locked" or staked in a vault contract, and a corresponding Web2 instance is generated in the player's in-game inventory, flagged as `isLockedInGame = true`.

### Risks & Brutal Honesty
*   **Platform Restrictions:** Direct NFT integration risks banning from traditional app stores (Apple/Google). This model is best suited for PC/Web environments.
*   **UX Friction:** Web3 onboarding is notoriously difficult. Wallet creation and gas fee conceptualization can alienate traditional gamers.

---

## 3. The "Pixel Forge": AI-Generated Crafting
Integrating Generative AI (specifically models tuned for Pixel Art like PixelLab.ai) to create literally unique, one-of-a-kind items based on player prompts and RNG.

### The Crafting Flow
1.  **Input (Player Action):**
    *   **Fixed Materials:** Determine the base item type (e.g., Wood + Iron = Sword).
    *   **Add-ons (Optional):** Rare materials that influence elemental typing or stats (e.g., Ruby = Fire affinity).
    *   **Imaginative Prompt:** A text string from the player (e.g., "A fiery greatsword with a dragon hilt").
2.  **Processing (Backend "Magic"):**
    *   **Prompt Engineering:** The backend acts as a wrapper, sanitizing and strictly formatting the player's prompt to ensure consistency with the game's art direction.
        *   *Example:* `A pixel art 32x32 icon of a fantasy sword, elemental fire, [Player Prompt], white background, HD-2D style`.
    *   **Stat Generation (RNG, NOT AI):** Critical stats (ATK, Durability) are generated via traditional backend RNG based on material rarity, *never* trusted to the LLM to prevent exploit prompts (e.g., "Make this sword do 1 million damage").
3.  **Image Generation & Hosting:**
    *   The formatted prompt is sent to `PixelLab.ai` (or similar specialized pixel model).
    *   The resulting image is processed (e.g., removing backgrounds via Alpha Channel).
    *   The transparent PNG is uploaded to IPFS (InterPlanetary File System) for permanent, decentralized hosting.
4.  **Output (The NFT):** The generated image URL (IPFS) and the RNG-generated stats are combined into standard NFT metadata, ready for the user to mint as described in Section 2.

### Risks & Brutal Honesty
*   **API Costs:** Generation APIs cost real money per image. This feature **must** be monetized (e.g., "Premium Forge Tickets" bought with fiat/crypto) to be sustainable.
*   **Art Consistency:** Strict ControlNets or LoRAs are required if self-hosting, or a highly specialized service like PixelLab.ai must be used to prevent "AI Slop" that breaks the game's aesthetic.
*   **Latency:** Image generation takes time. The UI must feature engaging loading animations (e.g., an anvil sparking) to mask the API response time.
