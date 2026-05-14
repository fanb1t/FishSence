type ZoneSearchingProps = {
    value: string;
    onChange: (value: string) => void;
};

export function ZoneSearching({ value, onChange }: ZoneSearchingProps) {
    return (
        <div>
            <input
                type="text"
                aria-label="ค้นหาพื้นที่ชายฝั่ง"
                placeholder="ค้นหาพื้นที่..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
