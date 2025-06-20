import { Link } from "react-router";

// function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35.0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35.0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
//       <path d="M9 18c-4.51 2-5-2-7-2" />
//     </svg>
//   );
// }

// function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M22 4s-.7 2.1-2 3.4c1.6 1.4 3 4.9 3 8.7 0 3.3-1.7 5.4-4 6.8-2 .9-4.7 1-7 1-5.5 0-8-3.9-8-8.5 0-4.2 2.7-7.6 6.5-8.8l2.5 2.3c-2 .9-3.5 3.1-3.5 5.6 0 2.8 2.2 5.1 5 5.1s5-2.3 5-5.1-2.2-5.1-5-5.1c-.4 0-.8.1-1.2.2" />
//     </svg>
//   );
// }

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 text-gray-700 py-6 dark:bg-gray-800 dark:text-gray-300">
    {/* // <footer className="bg-gray-100 text-gray-700 py-6 dark:bg-gray-800 dark:text-gray-300"> */}
      <div className="container mx-auto flex max-w-screen-lg flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm">
            © {currentYear} StartBeyond. All rights reserved.{" "}
            <em className="italic">Beta</em>
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
          <Link
            to="/about"
            className="text-sm hover:underline"
            aria-label="About"
          >
            About
          </Link>
          <Link
            to="/terms"
            className="text-sm hover:underline"
            aria-label="Terms of Service"
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className="text-sm hover:underline"
            aria-label="Privacy Policy"
          >
            Privacy
          </Link>
          <a
            href="mailto:notivior@gmail.com"
            className="text-sm hover:underline"
          >
            Contact
          </a>
          {/* <a
            href="https://github.com/your-github"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com/your-twitter"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <TwitterIcon className="h-5 w-5" />
          </a> */}
        </nav>
      </div>
    </footer>
  );
} 