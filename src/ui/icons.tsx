import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="icon"
      {...props}
    >
      {children}
    </svg>
  )
}

export function SoundOnIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9.2h3.8L13 5.2v13.6l-5.2-4H4z" />
      <path d="M16.2 9.3c1.2 1.5 1.2 3.9 0 5.4" />
      <path d="M18.8 6.8c2.6 2.8 2.6 7.6 0 10.4" />
    </IconBase>
  )
}

export function SoundOffIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9.2h3.8L13 5.2v13.6l-5.2-4H4z" />
      <path d="M16.5 9.5l5 5" />
      <path d="M21.5 9.5l-5 5" />
    </IconBase>
  )
}

export function ReturnIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 5.5v6.4a3.6 3.6 0 0 1-3.6 3.6H5" />
      <path d="M8.6 11.6 4.6 15.5l4 3.9" />
    </IconBase>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5v11.2" />
      <path d="M8.2 7.3L12 3.5l3.8 3.8" />
      <path d="M5.5 12.5v7.2h13v-7.2" />
    </IconBase>
  )
}

export function ExpandIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 4.5H4.5V9" />
      <path d="M15 4.5h4.5V9" />
      <path d="M9 19.5H4.5V15" />
      <path d="M15 19.5h4.5V15" />
    </IconBase>
  )
}

export function CollapseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 9H9V4.5" />
      <path d="M19.5 9H15V4.5" />
      <path d="M4.5 15H9v4.5" />
      <path d="M19.5 15H15v4.5" />
    </IconBase>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.8v5.2" />
      <path d="M12 7.8h.01" />
    </IconBase>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </IconBase>
  )
}
