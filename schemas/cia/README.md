# CIA Schemas Directory

## Current Status

⚠️ **Note**: The CIA platform currently provides schema **documentation** in Markdown format rather than formal JSON Schema files.

### Available Schema Documentation

The CIA repository contains the following schema documentation:

- **politician-schema.md** - Comprehensive politician profile specification
- **party-schema.md** - Political party data structure
- **committee-schema.md** - Parliamentary committee information
- **ministry-schema.md** - Government ministry data
- **intelligence-schema.md** - Intelligence and risk assessment data

### Location

Schema documentation: https://github.com/Hack23/cia/tree/master/json-export-specs/schemas

### Future Work

When the CIA platform publishes formal JSON Schema files (`.schema.json`), the synchronization scripts in this repository will automatically fetch and validate against them.

### Current Approach

Until formal JSON schemas are available:

1. **Schema Documentation**: Reference CIA's Markdown schema documentation
2. **Manual Validation**: Validate data structure against documented specifications
3. **Future Automation**: Ready to sync formal schemas when available

### Monitoring

The `check-cia-schema-updates.yml` workflow will detect when formal JSON Schema files become available and automatically create a PR to sync them.

---

**Last Updated**: 2026-02-05  
**CIA Repository**: https://github.com/Hack23/cia
