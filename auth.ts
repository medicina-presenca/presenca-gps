@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: #1A5F9C;
    --color-primary-dark: #144a7a;
    --color-primary-light: #5b9fdb;
  }

  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer utilities {
  .bg-primary {
    background-color: var(--color-primary);
  }
  
  .bg-primary-dark {
    background-color: var(--color-primary-dark);
  }
  
  .text-primary {
    color: var(--color-primary);
  }
  
  .text-primary-light {
    color: var(--color-primary-light);
  }
  
  .border-primary {
    border-color: var(--color-primary);
  }
}
