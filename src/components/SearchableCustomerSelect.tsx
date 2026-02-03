"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

import { Customer } from "@/types";

interface SearchableCustomerSelectProps {
    customers: Customer[];
    value: number | null;
    onChange: (customerId: number, customerName: string) => void;
    placeholder?: string;
}

export default function SearchableCustomerSelect({
    customers,
    value,
    onChange,
    placeholder = "เลือกลูกค้า..."
}: SearchableCustomerSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedCustomer = customers.find(c => c.id === value);

    const filteredCustomers = customers.filter(c => {
        const caseNumber = `DE${c.id.toString().padStart(4, "0")}`;
        const searchLower = searchTerm.toLowerCase();
        return (
            caseNumber.toLowerCase().includes(searchLower) ||
            c.name.toLowerCase().includes(searchLower) ||
            (c.subdomain || "").toLowerCase().includes(searchLower)
        );
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (customer: Customer) => {
        onChange(customer.id, customer.name);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(0, "");
        setSearchTerm("");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="input-field w-full flex items-center justify-between gap-2"
            >
                <span className={selectedCustomer ? "text-text-main/90" : "text-text-muted"}>
                    {selectedCustomer ? (
                        <span className="flex items-center gap-2">
                            <span className="font-mono text-indigo-400">DE{selectedCustomer.id.toString().padStart(4, "0")}</span>
                            <span>-</span>
                            <span>{selectedCustomer.name}</span>
                        </span>
                    ) : placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {selectedCustomer && (
                        <X
                            className="w-3.5 h-3.5 text-text-muted hover:text-text-main/80"
                            onClick={handleClear}
                        />
                    )}
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card-bg border border-border rounded-xl shadow-2xl max-h-64 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                    style={{ willChange: "opacity, transform" }}>
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ค้นหา รหัส, ชื่อ, หรือลิงก์..."
                                className="w-full pl-8 pr-3 py-1.5 bg-black/20 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-48 custom-scrollbar">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => handleSelect(customer)}
                                    className="w-full px-3 py-2 text-left hover:bg-bg-hover transition-colors border-b border-border-light last:border-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-indigo-400">
                                            DE{customer.id.toString().padStart(4, "0")}
                                        </span>
                                        <span className="text-xs text-text-main/90 flex-1 truncate">{customer.name}</span>
                                    </div>
                                    <div className="text-[10px] text-text-muted truncate mt-0.5">{customer.subdomain}</div>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-text-muted">
                                ไม่พบข้อมูลลูกค้า
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
