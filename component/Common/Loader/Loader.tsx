const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#674d9f] border-t-transparent" />
      <span className="text-sm text-gray-400">Loading...</span>
    </div>
  )
}

export default Loader
