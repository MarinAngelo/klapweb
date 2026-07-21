#!/bin/bash
# Schützt slicemachine.config.json vor Überschreibung bei Merges
# Wird nach jedem Merge ausgeführt

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CONFIG_FILE="slicemachine.config.json"

# Speicherte Configs pro Branch
declare -A BRANCH_CONFIGS=(
	["klap-web-ch"]="individuell"
	["klap-web-ch-staging"]="individuell"
	["main"]="individuell"
	["main-feature-rechnung"]="individuell"
)

# Hole expected plan für diese Branch
EXPECTED_PLAN=${BRANCH_CONFIGS[$CURRENT_BRANCH]}

if [ -z "$EXPECTED_PLAN" ]; then
	echo "ℹ️  Branch $CURRENT_BRANCH ist nicht in Schutzliste"
	exit 0
fi

# Überprüfe aktuelle Plan
CURRENT_PLAN=$(grep -oP '"plan":\s*"\K[^"]+' "$CONFIG_FILE" 2>/dev/null)

if [ "$CURRENT_PLAN" != "$EXPECTED_PLAN" ]; then
	echo "⚠️  WARNUNG: Plan wurde überschrieben!"
	echo "   Erwartet: $EXPECTED_PLAN"
	echo "   Aktuell:  $CURRENT_PLAN"
	echo ""
	echo "🔧 Stelle richtige Konfiguration wieder her..."

	# Stelle vorherige Version wieder her
	git checkout HEAD -- "$CONFIG_FILE"

	if [ $? -eq 0 ]; then
		echo "✅ $CONFIG_FILE wiederhergestellt"
	else
		echo "❌ Fehler beim Wiederherstellen"
		exit 1
	fi
fi

exit 0
