<script lang="ts">
	import type { MietvertragDaten } from '../api/mietvertrag/+server';

	let loading = false;
	let error = '';
	let untermiete = false;
	let untermietersAnzahl = 1;

	const today = new Date().toISOString().split('T')[0];

	let d: MietvertragDaten = {
		vermieter_name: '',
		vermieter_adresse: '',
		vermieter_plz_ort: '',
		vermieter_telefon: '',
		vermieter_email: '',

		mieter1_vorname: '',
		mieter1_name: '',
		mieter1_geburtsdatum: '',
		mieter1_bisherige_adresse: '',
		mieter1_plz_ort: '',
		mieter1_telefon: '',
		mieter1_email: '',
		mieter2_vorname: '',
		mieter2_name: '',
		mieter2_geburtsdatum: '',

		objekt_strasse: '',
		objekt_plz_ort: '',
		objekt_lage: '',
		objekt_art: 'Wohnung',
		objekt_zimmer: '',
		objekt_nebenraeume: '',

		miet_beginn: '',
		miet_typ: 'unbefristet',
		miet_ende: '',
		kuendigungsfrist: '3',
		kuendigungstermine: '1. April und 1. Oktober',

		nettomiete: '',
		nebenkosten: '',
		zahlungstag: '1',

		kaution_betrag: '',
		kaution_art: 'Bankdepot (Sperrkonto)',
		kaution_bank: '',

		ist_untermiete: false,
		untermieter1_vorname: '', untermieter1_name: '', untermieter1_geburtsdatum: '',
		untermieter1_adresse: '', untermieter1_plz_ort: '',
		untermieter2_vorname: '', untermieter2_name: '', untermieter2_geburtsdatum: '',
		untermieter2_adresse: '', untermieter2_plz_ort: '',
		untermieter3_vorname: '', untermieter3_name: '', untermieter3_geburtsdatum: '',
		untermieter3_adresse: '', untermieter3_plz_ort: '',
		untermiet_raeume: '',
		untermiet_zins: '',

		uebergabe_datum: '',
		uebergabe_zustand: 'Gut',

		ort: '',
		datum: today,
		bemerkungen: '',
	};

	$: d.ist_untermiete = untermiete;
	$: if (!untermiete) untermietersAnzahl = 1;

	$: brutto = (() => {
		const n  = parseFloat(d.nettomiete);
		const nk = parseFloat(d.nebenkosten);
		if (!isNaN(n) && !isNaN(nk)) return (n + nk).toFixed(2);
		if (!isNaN(n)) return n.toFixed(2);
		return '';
	})();

	async function submit() {
		error = '';
		loading = true;
		try {
			const res = await fetch('/api/mietvertrag', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(d),
			});
			if (!res.ok) throw new Error(await res.text());
			const blob = await res.blob();
			const url  = URL.createObjectURL(blob);
			const a    = document.createElement('a');
			const name = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]
				?? 'Mietvertrag.pdf';
			a.href     = url;
			a.download = name;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unbekannter Fehler';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Mietvertrag Generator – Kanton Zürich</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen" style="background:#f4f5f7; font-family: inherit;">

	<!-- Header -->
	<div style="background:#1e2d5a; color:#fff; padding:2rem 0;">
		<div class="mx-auto px-6" style="max-width:800px;">
			<h1 style="margin:0; font-size:1.6rem; font-weight:700; letter-spacing:-0.02em;">
				Mietvertrag Generator
			</h1>
			<p style="margin:0.4rem 0 0; opacity:0.7; font-size:0.9rem;">
				Kanton Zürich · Wohn- und Gewerberäume · OR Art. 253 ff.
			</p>
		</div>
	</div>

	<form on:submit|preventDefault={submit}
		class="mx-auto px-6 py-8" style="max-width:800px;">

		<!-- ── Vermieter ──────────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Vermieter</h2>
			<div class="grid2">
				<div class="field span2">
					<label>Name / Firma <span class="req">*</span></label>
					<input bind:value={d.vermieter_name} required placeholder="Max Mustermann / Mustermann Immobilien AG" />
				</div>
				<div class="field span2">
					<label>Strasse und Hausnummer <span class="req">*</span></label>
					<input bind:value={d.vermieter_adresse} required placeholder="Musterstrasse 12" />
				</div>
				<div class="field">
					<label>PLZ und Ort <span class="req">*</span></label>
					<input bind:value={d.vermieter_plz_ort} required placeholder="8001 Zürich" />
				</div>
				<div class="field">
					<label>Telefon</label>
					<input bind:value={d.vermieter_telefon} type="tel" placeholder="+41 44 000 00 00" />
				</div>
				<div class="field span2">
					<label>E-Mail</label>
					<input bind:value={d.vermieter_email} type="email" placeholder="vermieter@beispiel.ch" />
				</div>
			</div>
		</section>

		<!-- ── Mieter ─────────────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Mieter/in</h2>
			<p class="hint">Hauptmieter/in</p>
			<div class="grid3">
				<div class="field">
					<label>Vorname <span class="req">*</span></label>
					<input bind:value={d.mieter1_vorname} required placeholder="Maria" />
				</div>
				<div class="field">
					<label>Name <span class="req">*</span></label>
					<input bind:value={d.mieter1_name} required placeholder="Muster" />
				</div>
				<div class="field">
					<label>Geburtsdatum</label>
					<input bind:value={d.mieter1_geburtsdatum} type="date" />
				</div>
				<div class="field span2">
					<label>Bisherige Adresse <span class="req">*</span></label>
					<input bind:value={d.mieter1_bisherige_adresse} required placeholder="Alte Strasse 5" />
				</div>
				<div class="field">
					<label>PLZ und Ort</label>
					<input bind:value={d.mieter1_plz_ort} placeholder="8000 Zürich" />
				</div>
				<div class="field">
					<label>Telefon</label>
					<input bind:value={d.mieter1_telefon} type="tel" placeholder="+41 79 000 00 00" />
				</div>
				<div class="field span2">
					<label>E-Mail</label>
					<input bind:value={d.mieter1_email} type="email" placeholder="mieter@beispiel.ch" />
				</div>
			</div>

			<p class="hint" style="margin-top:1.25rem;">2. Mieter/in (optional)</p>
			<div class="grid3">
				<div class="field">
					<label>Vorname</label>
					<input bind:value={d.mieter2_vorname} placeholder="Hans" />
				</div>
				<div class="field">
					<label>Name</label>
					<input bind:value={d.mieter2_name} placeholder="Muster" />
				</div>
				<div class="field">
					<label>Geburtsdatum</label>
					<input bind:value={d.mieter2_geburtsdatum} type="date" />
				</div>
			</div>
		</section>

		<!-- ── Untermiete ────────────────────────────────────────────────── -->
		<section class="card">
			<div class="toggle-header">
				<div>
					<h2 class="section-title" style="margin:0; border:none; padding:0;">Untermiete</h2>
					<p class="hint" style="margin:.2rem 0 0;">Hauptmieter vermietet Teile weiter (OR Art. 262)</p>
				</div>
				<label class="toggle-switch">
					<input type="checkbox" bind:checked={untermiete} />
					<span class="toggle-track"><span class="toggle-thumb"></span></span>
				</label>
			</div>

			{#if untermiete}
				<div style="margin-top:1.25rem;">
					{#each Array.from({length: untermietersAnzahl}, (_, i) => i + 1) as nr}
						<div class="untermieter-block">
							<p class="hint">Untermieter/in {nr}{nr === 1 ? ' *' : ' (optional)'}</p>
							<div class="grid3">
								<div class="field">
									<label>Vorname{nr === 1 ? ' *' : ''}</label>
									{#if nr === 1}
										<input bind:value={d.untermieter1_vorname} required={untermiete} placeholder="Anna" />
									{:else if nr === 2}
										<input bind:value={d.untermieter2_vorname} placeholder="Beat" />
									{:else}
										<input bind:value={d.untermieter3_vorname} placeholder="Carla" />
									{/if}
								</div>
								<div class="field">
									<label>Name{nr === 1 ? ' *' : ''}</label>
									{#if nr === 1}
										<input bind:value={d.untermieter1_name} required={untermiete} placeholder="Muster" />
									{:else if nr === 2}
										<input bind:value={d.untermieter2_name} placeholder="Muster" />
									{:else}
										<input bind:value={d.untermieter3_name} placeholder="Muster" />
									{/if}
								</div>
								<div class="field">
									<label>Geburtsdatum</label>
									{#if nr === 1}
										<input bind:value={d.untermieter1_geburtsdatum} type="date" />
									{:else if nr === 2}
										<input bind:value={d.untermieter2_geburtsdatum} type="date" />
									{:else}
										<input bind:value={d.untermieter3_geburtsdatum} type="date" />
									{/if}
								</div>
								<div class="field span2">
									<label>Bisherige Adresse</label>
									{#if nr === 1}
										<input bind:value={d.untermieter1_adresse} placeholder="Bisherige Strasse 7" />
									{:else if nr === 2}
										<input bind:value={d.untermieter2_adresse} placeholder="Bisherige Strasse 7" />
									{:else}
										<input bind:value={d.untermieter3_adresse} placeholder="Bisherige Strasse 7" />
									{/if}
								</div>
								<div class="field">
									<label>PLZ und Ort</label>
									{#if nr === 1}
										<input bind:value={d.untermieter1_plz_ort} placeholder="8000 Zürich" />
									{:else if nr === 2}
										<input bind:value={d.untermieter2_plz_ort} placeholder="8000 Zürich" />
									{:else}
										<input bind:value={d.untermieter3_plz_ort} placeholder="8000 Zürich" />
									{/if}
								</div>
							</div>
						</div>
					{/each}

					<div class="btn-row">
						{#if untermietersAnzahl < 3}
							<button type="button" class="btn-add"
								on:click={() => untermietersAnzahl = Math.min(3, untermietersAnzahl + 1)}>
								+ Weiteren Untermieter hinzufügen
							</button>
						{/if}
						{#if untermietersAnzahl > 1}
							<button type="button" class="btn-remove"
								on:click={() => untermietersAnzahl = Math.max(1, untermietersAnzahl - 1)}>
								− Letzten entfernen
							</button>
						{/if}
					</div>

					<div class="grid2" style="margin-top:1rem;">
						<div class="field span2">
							<label>Untervermietete Räume / Teile <span class="req">*</span></label>
							<input bind:value={d.untermiet_raeume} required={untermiete}
								placeholder="z.B. Zimmer 2 (ca. 14 m²), Mitbenutzung Küche und Bad" />
						</div>
						<div class="field">
							<label>Untermietzins CHF/Monat <span class="req">*</span></label>
							<div class="input-prefix">
								<span>CHF</span>
								<input bind:value={d.untermiet_zins} type="number" min="0" step="0.05"
									required={untermiete} placeholder="800.00" />
							</div>
						</div>
						<div class="field" style="align-self:end;">
							<p class="hint" style="margin:0; font-size:.75rem; line-height:1.4;">
								Darf den anteiligen Hauptmietzins nicht übermässig übersteigen (OR Art. 262 Abs. 2 lit. b).
							</p>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<!-- ── Mietobjekt ─────────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Mietobjekt</h2>
			<div class="grid2">
				<div class="field span2">
					<label>Strasse und Hausnummer <span class="req">*</span></label>
					<input bind:value={d.objekt_strasse} required placeholder="Wohnstrasse 3" />
				</div>
				<div class="field">
					<label>PLZ und Ort <span class="req">*</span></label>
					<input bind:value={d.objekt_plz_ort} required placeholder="8001 Zürich" />
				</div>
				<div class="field">
					<label>Lage (Etage / Ausrichtung)</label>
					<input bind:value={d.objekt_lage} placeholder="2. OG, links" />
				</div>
				<div class="field">
					<label>Art des Mietobjekts <span class="req">*</span></label>
					<select bind:value={d.objekt_art} required>
						<option>Wohnung</option>
						<option>Zimmer</option>
						<option>Atelier / Studio</option>
						<option>Büro</option>
						<option>Gewerberäume</option>
						<option>Lager</option>
						<option>Einstellhallenplatz</option>
						<option>Parkplatz aussen</option>
						<option>Einfamilienhaus</option>
					</select>
				</div>
				<div class="field">
					<label>Anzahl Zimmer</label>
					<input bind:value={d.objekt_zimmer} placeholder="3.5" />
				</div>
				<div class="field span2">
					<label>Nebenräume</label>
					<input bind:value={d.objekt_nebenraeume}
						placeholder="Keller Nr. 4, Estrichanteil, Autoeinstellplatz Nr. 7" />
				</div>
			</div>
		</section>

		<!-- ── Mietdauer ──────────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Mietdauer</h2>
			<div class="grid3">
				<div class="field">
					<label>Mietbeginn <span class="req">*</span></label>
					<input bind:value={d.miet_beginn} type="date" required />
				</div>
				<div class="field">
					<label>Kündigungsfrist (Monate)</label>
					<select bind:value={d.kuendigungsfrist}>
						<option value="1">1 Monat</option>
						<option value="2">2 Monate</option>
						<option value="3">3 Monate (Standard)</option>
						<option value="6">6 Monate</option>
					</select>
				</div>
				<div class="field">
					<label>Mietverhältnis</label>
					<div class="radio-group">
						<label class="radio">
							<input type="radio" bind:group={d.miet_typ} value="unbefristet" />
							Unbefristet
						</label>
						<label class="radio">
							<input type="radio" bind:group={d.miet_typ} value="befristet" />
							Befristet
						</label>
					</div>
				</div>
				{#if d.miet_typ === 'befristet'}
					<div class="field">
						<label>Befristet bis <span class="req">*</span></label>
						<input bind:value={d.miet_ende} type="date" />
					</div>
				{/if}
				<div class="field span3">
					<label>Kündigungstermine</label>
					<input bind:value={d.kuendigungstermine}
						placeholder="1. April und 1. Oktober" />
				</div>
			</div>
		</section>

		<!-- ── Mietzins ───────────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Mietzins und Nebenkosten</h2>
			<div class="grid3">
				<div class="field">
					<label>Nettomiete CHF/Monat <span class="req">*</span></label>
					<div class="input-prefix">
						<span>CHF</span>
						<input bind:value={d.nettomiete} type="number" min="0" step="0.05"
							required placeholder="1500.00" />
					</div>
				</div>
				<div class="field">
					<label>Nebenkosten Akonto CHF/Monat</label>
					<div class="input-prefix">
						<span>CHF</span>
						<input bind:value={d.nebenkosten} type="number" min="0" step="0.05"
							placeholder="200.00" />
					</div>
				</div>
				<div class="field">
					<label>Bruttomiete Total</label>
					<div class="input-prefix readonly">
						<span>CHF</span>
						<input value={brutto} readonly placeholder="—" />
					</div>
				</div>
				<div class="field">
					<label>Zahlbar am … des Monats</label>
					<select bind:value={d.zahlungstag}>
						{#each Array.from({length:28}, (_,i)=>`${i+1}`) as t}
							<option value={t}>{t}.</option>
						{/each}
					</select>
				</div>
			</div>
		</section>

		<!-- ── Kaution ────────────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Mietzinskaution</h2>
			<p class="hint">Max. 3 Nettomieten · OR Art. 257e</p>
			<div class="grid3">
				<div class="field">
					<label>Kautionsbetrag CHF</label>
					<div class="input-prefix">
						<span>CHF</span>
						<input bind:value={d.kaution_betrag} type="number" min="0" step="0.05"
							placeholder="4500.00" />
					</div>
				</div>
				<div class="field">
					<label>Hinterlegungsart</label>
					<select bind:value={d.kaution_art}>
						<option>Bankdepot (Sperrkonto)</option>
						<option>Mietkautionsversicherung</option>
						<option>Barkaution</option>
					</select>
				</div>
				<div class="field">
					<label>Bank / Institut</label>
					<input bind:value={d.kaution_bank} placeholder="ZKB, UBS, …" />
				</div>
			</div>
		</section>

		<!-- ── Übergabe ───────────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Übergabe</h2>
			<div class="grid2">
				<div class="field">
					<label>Übergabedatum</label>
					<input bind:value={d.uebergabe_datum} type="date" />
				</div>
				<div class="field">
					<label>Zustand des Mietobjekts</label>
					<select bind:value={d.uebergabe_zustand}>
						<option>Gut</option>
						<option>Sehr gut</option>
						<option>Neuwertig (renoviert)</option>
						<option>Befriedigend</option>
					</select>
				</div>
			</div>
		</section>

		<!-- ── Besondere Vereinbarungen ───────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Besondere Vereinbarungen</h2>
			<div class="field">
				<label>Zusätzliche Abmachungen (optional)</label>
				<textarea bind:value={d.bemerkungen} rows="4"
					placeholder="z.B. Haustiere erlaubt, Gartenpflege durch Mieter, …"></textarea>
			</div>
		</section>

		<!-- ── Ort und Datum ──────────────────────────────────────────────── -->
		<section class="card">
			<h2 class="section-title">Vertragsabschluss</h2>
			<div class="grid2">
				<div class="field">
					<label>Ort <span class="req">*</span></label>
					<input bind:value={d.ort} required placeholder="Zürich" />
				</div>
				<div class="field">
					<label>Datum <span class="req">*</span></label>
					<input bind:value={d.datum} type="date" required />
				</div>
			</div>
		</section>

		<!-- ── Absenden ───────────────────────────────────────────────────── -->
		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div style="text-align:center; padding:1rem 0 2rem;">
			<button type="submit" class="btn-primary" disabled={loading}>
				{#if loading}
					<span class="spinner"></span> PDF wird generiert …
				{:else}
					PDF generieren & herunterladen
				{/if}
			</button>
			<p style="margin-top:.75rem; font-size:.8rem; color:#888;">
				Dieser Vertrag basiert auf OR Art. 253 ff. · Bitte durch Anwalt oder Verband prüfen lassen.
			</p>
		</div>
	</form>
</div>

<style>
	:global(body) { margin: 0; }

	.card {
		background: #fff;
		border-radius: 10px;
		padding: 1.5rem 1.75rem;
		margin-bottom: 1.25rem;
		box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04);
	}

	.section-title {
		margin: 0 0 1.1rem;
		font-size: .8rem;
		font-weight: 700;
		letter-spacing: .08em;
		text-transform: uppercase;
		color: #1e2d5a;
		padding-bottom: .6rem;
		border-bottom: 2px solid #1e2d5a18;
	}

	.hint {
		margin: -.4rem 0 .9rem;
		font-size: .8rem;
		color: #888;
	}

	.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem 1.25rem; }
	.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .85rem 1.25rem; }
	.span2 { grid-column: span 2; }
	.span3 { grid-column: span 3; }

	@media (max-width: 600px) {
		.grid2, .grid3 { grid-template-columns: 1fr; }
		.span2, .span3 { grid-column: span 1; }
	}

	.field { display: flex; flex-direction: column; gap: .3rem; }
	.field label { font-size: .78rem; font-weight: 600; color: #555; }
	.req { color: #c0392b; }

	input, select, textarea {
		width: 100%;
		box-sizing: border-box;
		padding: .52rem .7rem;
		border: 1.5px solid #dde;
		border-radius: 6px;
		font-size: .92rem;
		font-family: inherit;
		color: #1a1a2e;
		background: #fafbfc;
		transition: border-color .15s;
		outline: none;
	}
	input:focus, select:focus, textarea:focus {
		border-color: #1e2d5a;
		background: #fff;
	}
	input[readonly] { background: #f0f2f5; color: #555; cursor: default; }
	textarea { resize: vertical; min-height: 90px; }

	.input-prefix {
		display: flex;
		align-items: center;
		border: 1.5px solid #dde;
		border-radius: 6px;
		overflow: hidden;
		background: #fafbfc;
	}
	.input-prefix:focus-within { border-color: #1e2d5a; background: #fff; }
	.input-prefix.readonly { background: #f0f2f5; }
	.input-prefix span {
		padding: 0 .6rem;
		font-size: .82rem;
		font-weight: 600;
		color: #888;
		background: #f0f2f5;
		border-right: 1.5px solid #dde;
		white-space: nowrap;
	}
	.input-prefix input {
		border: none;
		border-radius: 0;
		background: transparent;
		flex: 1;
	}
	.input-prefix input:focus { box-shadow: none; }

	.radio-group { display: flex; gap: 1.2rem; padding: .4rem 0; }
	.radio { display: flex; align-items: center; gap: .4rem; font-size: .9rem; cursor: pointer; color: #333; }
	.radio input { width: auto; }

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: .6rem;
		padding: .85rem 2.5rem;
		background: #1e2d5a;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background .15s, transform .1s;
		font-family: inherit;
	}
	.btn-primary:hover:not(:disabled) { background: #2a3f7a; transform: translateY(-1px); }
	.btn-primary:disabled { opacity: .65; cursor: not-allowed; }

	.spinner {
		width: 16px; height: 16px;
		border: 2px solid rgba(255,255,255,.4);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin .7s linear infinite;
		display: inline-block;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	.error {
		background: #fdecea;
		border: 1px solid #f5c6c2;
		color: #c0392b;
		padding: .75rem 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: .9rem;
	}

	.toggle-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.toggle-switch {
		flex-shrink: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
	}
	.toggle-switch input { display: none; }

	.toggle-track {
		display: block;
		width: 44px;
		height: 24px;
		border-radius: 12px;
		background: #d1d5db;
		position: relative;
		transition: background .2s;
	}
	.toggle-switch input:checked ~ .toggle-track { background: #1e2d5a; }

	.toggle-thumb {
		display: block;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #fff;
		position: absolute;
		top: 3px;
		left: 3px;
		transition: left .2s;
		box-shadow: 0 1px 3px rgba(0,0,0,.2);
	}
	.toggle-switch input:checked ~ .toggle-track .toggle-thumb { left: 23px; }

	.untermieter-block {
		padding: .75rem 0;
		border-bottom: 1px solid #f0f0f0;
		margin-bottom: .5rem;
	}
	.untermieter-block:last-of-type { border-bottom: none; }

	.btn-row { display: flex; gap: .75rem; flex-wrap: wrap; margin: .5rem 0; }

	.btn-add, .btn-remove {
		display: inline-flex;
		align-items: center;
		padding: .4rem .9rem;
		border-radius: 6px;
		font-size: .82rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		border: 1.5px solid;
		transition: background .15s, color .15s;
	}
	.btn-add { background: #f0f3fa; color: #1e2d5a; border-color: #1e2d5a30; }
	.btn-add:hover { background: #1e2d5a; color: #fff; }
	.btn-remove { background: #fdf0f0; color: #c0392b; border-color: #c0392b30; }
	.btn-remove:hover { background: #c0392b; color: #fff; }
</style>
