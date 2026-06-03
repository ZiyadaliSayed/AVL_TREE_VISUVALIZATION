# 🌳 AVL Tree Visualizer

An interactive, highly animated web tool for visualizing Binary Search Trees (BST) and self-balancing AVL Trees. This project is designed to help students, developers, and educators intuitively understand how complex tree data structures operate, balance, and reorganize themselves in real-time.

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

* **Dual Mode:** Seamlessly toggle between a standard Binary Search Tree and a self-balancing AVL Tree to see the difference in structural behavior.
* **Step-by-Step Animation:** Watch algorithms execute node-by-node.
* **Granular Controls:** Pause, resume, and step through animations. Adjust the animation speed on the fly using the delay slider.
* **Dynamic Rebalancing:** Visualizes Left-Left (LL), Left-Right (LR), Right-Right (RR), and Right-Left (RL) rotations.
* **Live Tree Stats:** Automatically tracks total node count and maximum tree height.
* **Detailed Node Metrics:** Each node displays its current height and Balance Factor (BF), with visual warnings (red borders) for unbalanced nodes prior to rotation.

## 📖 Supported Operations

* **Insertions:** Build a tree manually or paste a comma-separated list of numbers (e.g., `10, 20, 30, 5, 15`) to batch-generate.
* **Deletions:** Remove any node and watch the tree automatically reassign children, find in-order successors, and trigger AVL rebalancing if necessary.
* **Search/Find:** Traverse the tree visually to locate specific values.
* **Traversals:** * In-order
    * Pre-order
    * Post-order
    * Breadth-First Search (Level-order)

## 🚀 Getting Started

Since this project uses vanilla JavaScript and standard HTML/CSS (with Tailwind via CDN), there are no complex dependencies, build steps, or package managers required.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/ZiyadaliSayed/AVL_TREE_VISUVALIZATION.git](https://github.com/ZiyadaliSayed/AVL_TREE_VISUVALIZATION.git)
   ```
2. **Navigate to the directory:**

   ```bash
   cd AVL_TREE_VISUVALIZATION
   ```

3. **Run the visualizer:**

  Simply open the AVL_TREE_VISUVALIZATION.html file in your preferred web browser.

  # 🧠 Educational Value
  AVL trees maintain an $O(\log n)$ search, insertion, and deletion time complexity by ensuring the height difference (Balance Factor) between the left and right subtrees of any node is never greater than 1. This visualizer breaks down the "black box" of those self-balancing algorithms by tracking an imaginary traveling node and outputting every logical decision directly into the integrated UI event log.
