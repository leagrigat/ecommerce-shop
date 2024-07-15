import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import db from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/formatters";

async function getSalesData() {
  const data = await db.order.aggregate({
    _sum: { priceInCents: true },
    _count: true,
  });
  await wait(2000);

  return {
    amount: (data._sum.priceInCents || 0) / 100, // to get a dollar value
    numberofSales: data._count,
  };
}

function wait(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function getUserData() {
  const [userCount, orderData] = await Promise.all([
    db.user.count(),
    db.order.aggregate({
      _sum: { priceInCents: true },
    }),
  ]);

  return {
    userCount,
    averageValuePerUser:
      userCount === 0 ? 0 : orderData._sum.priceInCents || 0 / userCount / 100,
  };
}

async function getProductData() {
  const [activeCount, inactiveCount] = await Promise.all([
    db.product.count({ where: { isAvailableForPurchase: true } }),
    db.product.count({ where: { isAvailableForPurchase: false } }),
  ]);

  return {
    activeCount,
    inactiveCount,
  };
}

export default async function AdminDashboard() {
  // using Promise.all() for parallel awaiting instead of back to back
  const [salesData, userData, productData] = await Promise.all([
    getSalesData(),
    getUserData(),
    getProductData(),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard
        title="Sales"
        subtitle={`${formatNumber(salesData.numberofSales)} Orders`}
        body={formatCurrency(salesData.amount)}
      />
      <DashboardCard
        title="Customers"
        subtitle={`${formatCurrency(userData.averageValuePerUser)} Average Value`}
        body={formatNumber(userData.userCount)}
      />
      <DashboardCard
        title="Active Products"
        subtitle={`${formatNumber(productData.inactiveCount)} Inactive`}
        body={formatNumber(productData.activeCount)}
      />
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  subtitle: string;
  body: string;
};

export function DashboardCard({ title, subtitle, body }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}
