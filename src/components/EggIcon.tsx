import { type SVGProps } from 'react';

const EggIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22C15.866 22 19 18.4183 19 14C19 9.58172 15.866 2 12 2C8.13401 2 5 9.58172 5 14C5 18.4183 8.13401 22 12 22Z" />
  </svg>
);

export default EggIcon;
