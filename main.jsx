@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f3;
  color: #1a1a1a;
}

input, select, textarea {
  @apply border border-gray-200 rounded-lg px-3 h-10 text-sm w-full outline-none bg-white;
}

input:focus, select:focus, textarea:focus {
  @apply border-blue-400 ring-2 ring-blue-100;
}

textarea {
  height: auto;
  padding: 10px 12px;
}
