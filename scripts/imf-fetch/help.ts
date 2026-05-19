/**
 * @module scripts/imf-fetch/help
 * @description `imf-fetch.ts --help` text.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export const HELP = `tsx scripts/imf-fetch.ts <command> [flags]

Commands:
  weo                          Fetch a WEO time series for one country
                               (auto-routes to SDMX when the requested code is
                               in IMF_WEO_SDMX_ONLY and IMF_SDMX_SUBSCRIPTION_KEY
                               is set)
  compare                      Fetch the latest WEO value across several countries
  sdmx                         Low-level SDMX 3.0 passthrough (IFS / BOP / FM /
                               GFS / DOTS / full WEO 9.0.0)
  list-indicators              Print the built-in WEO + FM indicator catalog
  list-datamapper-indicators   Fetch the live IMF Datamapper indicator catalog
                               (~132 entries, grouped by dataset). Use to discover
                               any indicator addressable without an SDMX
                               subscription key.
  help                         Show this message

Common flags:
  --country <ISO3>         ISO-3 country code (e.g. SWE)
  --countries <ISO3,...>   Comma-separated ISO-3 country codes
  --indicator <CODE>       IMF indicator code (e.g. NGDP_RPCH, PCPIPCH, LUR)
  --years <N>              Number of years (weo, default 10)
  --path <PATH>            SDMX URL path (sdmx)
  --persist                Write the response under analysis/data/imf/
  --database <NAME>        Provenance override (default WEO for weo/compare)
  --dataset <NAME>         Filter list-datamapper-indicators by dataset
                           (e.g. WEO, FM, FPP, IFS, BOP, DOTS, GFS_COFOG)
`;
