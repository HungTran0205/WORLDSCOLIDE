interface Props {
  width?: number | string
  height?: number | string
}

/** Plain CSS shimmer skeleton for loading states. */
export function SkeletonRow({ width = '100%', height = 18 }: Props) {
  return <div className="skeleton-row" style={{ width, height }} aria-hidden="true" />
}
