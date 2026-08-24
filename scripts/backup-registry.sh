#!/usr/bin/env bash
set -euo pipefail

registry_data="${ARCANE_REGISTRY_DATA:-/var/lib/arcane-record-registry}"
backup_directory="${ARCANE_REGISTRY_BACKUP_DIR:-/var/backups/arcane-record-registry}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

test -d "$registry_data"
mkdir -p "$backup_directory"
tar -C "$registry_data" -czf "$backup_directory/registry-$timestamp.tar.gz" .
find "$backup_directory" -type f -name 'registry-*.tar.gz' -mtime +30 -delete
