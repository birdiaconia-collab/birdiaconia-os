import { NextRequest, NextResponse } from "next/server";
import { filterPublicOffers, publicCatalog } from "../../../../../lib/unified/catalog";
import { publishedOfferRows } from "../../../../../data/unified/published-offers";

export const dynamic = "force-dynamic";

export function GET(request:NextRequest) {
 const params=request.nextUrl.searchParams;
 const rows=publicCatalog(publishedOfferRows);
 const offers=filterPublicOffers(rows,{
  region:params.get("region"),category:params.get("category"),
  q:params.get("q"),limit:Number(params.get("limit")??30),
 });
 return NextResponse.json({offers,count:offers.length},{
  headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"},
 });
}
