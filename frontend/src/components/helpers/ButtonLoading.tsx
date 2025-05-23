import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonLoadingProps = {
    isLoading: boolean
    onClick: ((event: React.MouseEvent<HTMLButtonElement>) => void) | (() => void)
    variant?: "default" | "outline" | "secondary" | "destructive";
    size?: "default" | "sm" | "lg"
    children?: ReactNode
    loadingText?: string
    id?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>

export function ButtonLoading({ isLoading, onClick, variant, size, children, loadingText, id, ...props }: ButtonLoadingProps) {
    return (
        <Button
            {...(id ? { id } : {})}
            onClick={onClick}
            disabled={isLoading || props.disabled}
            variant={variant}
            size={size}
            className={!loadingText? "min-w-[40px] h-[40px]" : ""}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {loadingText ? <div className="ml-2">{loadingText}</div>: null}
                </>
            ) : (
                children
            )}
        </Button>
    )
}
