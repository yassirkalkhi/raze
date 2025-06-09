import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-[0.4rem]",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  bgGradientOption,
  ...props
}: any) {
  return (
    <div
      data-slot="avatar-image"
      className={cn(`aspect-square size-full bg-radial-[at_25%_25%]  ${bgGradientOption}`, className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: any) {

  const bgGradient: string = props.gradientOption;
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        `bg-[length:200%_100%] bg-gradient-to-r ${bgGradient} rounded-[0.3rem] flex size-full items-center justify-center`,
        className
      )}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
