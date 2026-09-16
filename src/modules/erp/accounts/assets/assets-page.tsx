import {
  ArrowRight,
  BriefcaseBusiness,
  Package,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function AssetsPage() {
  const navigate = useNavigate();

  const totalInvestments = 250000;
  const visaInventory = 180000;
  const totalAssets = totalInvestments + visaInventory;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Manage business assets, investments and visa inventory.
          </p>
        </div>

        <Button onClick={() => navigate("/app/accounts/assets/investments")}>
          View Investments
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assets
            </CardTitle>
            <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {currency.format(totalAssets)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Current tracked asset value
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() =>
            navigate("/app/accounts/assets/investments")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Investments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {currency.format(totalInvestments)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Shares, deposits and other investments
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() =>
            navigate("/app/accounts/assets/visa-inventory")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Visa Inventory
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {currency.format(visaInventory)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Purchased visas currently held
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Management</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-auto justify-between p-4"
            onClick={() =>
              navigate("/app/accounts/assets/investments")
            }
          >
            <div className="text-left">
              <div className="font-medium">Investments</div>
              <div className="text-xs text-muted-foreground">
                Manage shares, deposits and other investments
              </div>
            </div>

            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-between p-4"
            onClick={() =>
              navigate("/app/accounts/assets/visa-inventory")
            }
          >
            <div className="text-left">
              <div className="font-medium">Visa Inventory</div>
              <div className="text-xs text-muted-foreground">
                Manage purchased visas held for future use
              </div>
            </div>

            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export { AssetsPage };