import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subnet Hesaplayıcı — Lider Network",
  description: "IP/CIDR subnet hesaplayıcı. Network adresi, broadcast, kullanılabilir host aralığı, netmask ve binary gösterim.",
};

export default function SubnetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
