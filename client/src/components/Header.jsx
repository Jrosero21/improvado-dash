export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-[#1E1F28]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#6E3BFF] flex items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1.5" y="1.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.95" />
            <rect x="8.5" y="1.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.4" />
            <rect x="1.5" y="8.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.4" />
            <rect x="8.5" y="8.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.95" />
          </svg>
        </div>
        <div>
          <span className="text-[15px] font-medium text-[#E8E9EF] tracking-tight">Ad Analytics</span>
          <span className="text-[13px] text-[#4B4D5E] ml-2">January 2024</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] text-[#4B4D5E]">Powered by</span>
        <span className="text-[12px] font-medium text-[#E8E9EF]">Improvado</span>
      </div>
    </header>
  );
}
