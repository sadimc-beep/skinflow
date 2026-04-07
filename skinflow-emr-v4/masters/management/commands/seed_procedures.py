"""
Management command to seed a comprehensive aesthetic clinic procedure catalog.
Creates ProcedureCategories and ProcedureTypes with full pricing, session counts,
and clinical flags.
"""
from django.core.management.base import BaseCommand
from core.models import Organization
from masters.models import ProcedureCategory, ProcedureType

# Format: (category_name, [
#     (name, description, base_price, default_sessions, consultation_required)
# ])
PROCEDURE_CATALOG = [
    ("Injectables & Neurotoxins", [
        (
            "Botulinum Toxin – Forehead Lines",
            "Injection of botulinum toxin type A (Botox / Dysport / Xeomin) to relax the "
            "horizontal frontalis muscles and smooth forehead lines. Results visible in 3–7 days "
            "and last 3–4 months. Dosage typically 10–20 units depending on muscle mass.",
            3500, 1, True
        ),
        (
            "Botulinum Toxin – Glabellar (Frown) Lines",
            "Treatment of the procerus and corrugator muscles responsible for the '11 lines' "
            "between the brows. Requires precise anatomical placement. Typically 15–25 units.",
            3500, 1, True
        ),
        (
            "Botulinum Toxin – Crow's Feet",
            "Bilateral injection to the orbicularis oculi (lateral periorbital) to soften "
            "wrinkles at the corners of the eyes. 5–15 units per side.",
            3000, 1, True
        ),
        (
            "Botulinum Toxin – Full Upper Face",
            "Comprehensive upper face treatment covering forehead, glabellar, and crow's feet "
            "in a single session. Typically 30–50 units total.",
            7000, 1, True
        ),
        (
            "Botulinum Toxin – Brow Lift",
            "Targeted placement to elevate the lateral brow and open the eye area. "
            "Used alone or combined with standard upper-face treatment.",
            2500, 1, True
        ),
        (
            "Botulinum Toxin – Masseter Reduction (Jaw Slimming)",
            "High-volume injections into the masseter muscle to reduce hypertrophy, "
            "creating a more oval facial contour and relieving bruxism. 25–50 units per side.",
            7500, 1, True
        ),
        (
            "Botulinum Toxin – Neck (Platysmal Bands)",
            "Treatment of platysmal bands to soften the necklace lines and improve overall "
            "neck aesthetics. 25–50 units across multiple injection points.",
            5000, 1, True
        ),
        (
            "Botulinum Toxin – Hyperhidrosis (Axillary)",
            "Intradermal injections into the axillary vault to block eccrine sweat gland "
            "activity. Typically 50 units per axilla with 2–3 cm grid spacing. "
            "Effect lasts 6–12 months.",
            9000, 1, True
        ),
        (
            "Botulinum Toxin – Gummy Smile Correction",
            "Relaxation of the levator labii superioris alaeque nasi to reduce excessive "
            "gingival show when smiling. 2–4 units bilateral.",
            2000, 1, True
        ),
        (
            "Botulinum Toxin – Bunny Lines",
            "Injection into the nasal transverse muscle to smooth lines on the nose bridge "
            "that appear when squinting or smiling.",
            1800, 1, True
        ),
    ]),

    ("Dermal Fillers", [
        (
            "Hyaluronic Acid Filler – Nasolabial Folds",
            "Injection of cross-linked HA filler (e.g., Juvederm Ultra, Restylane) to "
            "restore volume in the nasolabial folds. 0.5–1.5 ml per side. "
            "Results last 9–18 months.",
            9000, 1, True
        ),
        (
            "Hyaluronic Acid Filler – Lip Augmentation",
            "Precise volumisation and definition of the lips using HA filler. "
            "Includes vermilion border definition, Cupid's bow shaping, and body volume. "
            "0.5–1 ml total. Topical or nerve block anaesthesia applied.",
            8500, 1, True
        ),
        (
            "Hyaluronic Acid Filler – Cheek (Malar) Augmentation",
            "Mid-face volumisation using a high G-prime HA filler (e.g., Juvederm Voluma, "
            "Restylane Lyft) placed deep on periosteum. 1–2 ml per cheek. "
            "Duration 18–24 months.",
            14000, 1, True
        ),
        (
            "Hyaluronic Acid Filler – Tear Troughs (Under-Eye)",
            "Superficial placement of low-viscosity HA filler in the tear trough for "
            "correction of hollowing and dark circles. High technical precision required. "
            "0.2–0.5 ml per side.",
            11000, 1, True
        ),
        (
            "Hyaluronic Acid Filler – Jawline Contouring",
            "Structural augmentation of the jawline using a high G-prime filler injected "
            "along the mandible to improve definition. 1–3 ml total.",
            13000, 1, True
        ),
        (
            "Hyaluronic Acid Filler – Chin Projection",
            "Augmentation of the chin to improve facial projection and balance. "
            "Typically 0.5–1.5 ml with an immediate visible result.",
            9500, 1, True
        ),
        (
            "Hyaluronic Acid Filler – Nose (Non-Surgical Rhinoplasty)",
            "Reshaping of the nose bridge, tip, and nostrils using HA filler without surgery. "
            "Requires advanced technique due to vascular risk in the nose area.",
            12000, 1, True
        ),
        (
            "Hyaluronic Acid Filler – Temple Rejuvenation",
            "Correction of temporal hollowing using deep-plane HA or CaHA filler to "
            "restore the youthful convex temple silhouette.",
            10000, 1, True
        ),
        (
            "Radiesse (CaHA) Filler – Hands Rejuvenation",
            "Injection of calcium hydroxylapatite filler to restore volume and improve the "
            "skin quality on the dorsum of the hands. 1–2 ml per hand.",
            11000, 1, True
        ),
        (
            "Sculptra (PLLA) Bio-Stimulator",
            "Poly-L-lactic acid injection to stimulate collagen production for gradual, "
            "natural-looking volume restoration. Effects build over 3 months and last 2+ years. "
            "Series of 2–3 sessions recommended.",
            17000, 3, True
        ),
    ]),

    ("Laser & Energy Devices", [
        (
            "Nd:YAG Laser – Skin Toning / Whitening",
            "Low-fluence Q-switched Nd:YAG 1064nm laser for skin toning, lightening of "
            "pigmented lesions, and reduction of pore size. No downtime. "
            "Series of 4–8 sessions recommended.",
            3500, 6, False
        ),
        (
            "Q-Switched Nd:YAG – Pigment & Tattoo Removal",
            "High-energy Q-switched 532/1064nm pulses to shatter melanin and tattoo pigment "
            "particles. Multiple sessions required; number depends on lesion type and depth.",
            4500, 8, True
        ),
        (
            "Fractional CO2 Laser – Skin Resurfacing",
            "Ablative fractional CO2 laser for scar revision, deep wrinkle reduction, and "
            "overall skin resurfacing. 3–7 days downtime expected. "
            "Topical anaesthesia required.",
            12000, 1, True
        ),
        (
            "Fractional CO2 Laser – Acne Scar Treatment",
            "High-density fractional ablative columns targeting atrophic acne scars (ice pick, "
            "boxcar, rolling). Typically 3–4 sessions for optimal results. "
            "Post-procedure care protocol provided.",
            14000, 3, True
        ),
        (
            "Erbium YAG Laser – Superficial Resurfacing",
            "Non-ablative to mildly ablative 2940nm laser for superficial skin renewal with "
            "less downtime than CO2. Ideal for fine lines, texture, and tone.",
            9000, 2, True
        ),
        (
            "IPL (Intense Pulsed Light) – Photorejuvenation",
            "Broad-spectrum light therapy to target redness, sun damage, broken capillaries, "
            "and benign pigmented lesions. No downtime treatment.",
            5000, 4, False
        ),
        (
            "IPL – Hair Reduction (Small Area)",
            "Intense pulsed light photoepilation for small areas (upper lip, chin, underarm). "
            "Effective on Fitzpatrick I-III skin types.",
            2500, 6, False
        ),
        (
            "Diode Laser Hair Removal – Full Face",
            "810nm diode laser hair removal for the full face including upper lip, chin, "
            "cheeks, and sideburns. Suitable for darker skin types.",
            3500, 6, False
        ),
        (
            "Diode Laser Hair Removal – Full Leg",
            "810nm diode laser for complete hair removal of both legs from ankle to bikini line. "
            "Most patients require 6–8 sessions.",
            8000, 6, False
        ),
        (
            "Diode Laser Hair Removal – Full Back",
            "810nm diode laser hair removal for the entire dorsal surface including shoulders. "
            "Typically 6–8 sessions.",
            7500, 6, False
        ),
        (
            "Diode Laser Hair Removal – Bikini / Brazilian",
            "Precision hair removal of the pubic and perineal area. "
            "High-grade cooling handpiece for comfort. 6–8 sessions.",
            4000, 6, False
        ),
        (
            "HIFU – Face & Neck Lifting",
            "High-intensity focused ultrasound targeting SMAS layer and dermis to stimulate "
            "neocollagenesis and lift facial and neck skin without surgery. "
            "1–2 sessions per year.",
            22000, 1, True
        ),
        (
            "Radiofrequency Microneedling (RF Microneedling)",
            "Combination of fractional microneedles with bipolar radiofrequency to heat the "
            "deep dermis and stimulate collagen remodelling. Effective for laxity and scars.",
            15000, 3, True
        ),
        (
            "Monopolar Radiofrequency – Body Tightening",
            "Non-invasive RF for body skin laxity post weight loss or post-partum. "
            "Targets subdermal heating for collagen fibre contraction.",
            8000, 4, True
        ),
        (
            "Cryolipolysis (Fat Freezing) – Single Panel",
            "Controlled cooling of adipose tissue to 4–5°C to induce apoptosis of fat cells. "
            "One applicator per session. Results visible in 8–12 weeks.",
            12000, 1, True
        ),
    ]),

    ("Skin Rejuvenation & Facials", [
        (
            "HydraFacial MD – Signature (3-Step)",
            "Multi-step vortex extraction and hydration treatment using patented spiral suction "
            "tip. Includes cleanse, exfoliate, extract, and infuse with serums. "
            "Suitable for all skin types. No downtime.",
            5500, 1, False
        ),
        (
            "HydraFacial MD – Deluxe (with Booster)",
            "Signature 3-step protocol enhanced with a targeted growth factor or brightening "
            "booster serum (e.g., GrowthFactor or Britenol add-on).",
            7500, 1, False
        ),
        (
            "HydraFacial MD – Platinum (with LED)",
            "Full HydraFacial Deluxe plus super serum infusion and lymphatic drainage, "
            "completed with a full-spectrum LED light therapy session.",
            10000, 1, False
        ),
        (
            "Chemical Peel – Superficial (Glycolic/Lactic 20–35%)",
            "Light alpha-hydroxy acid peel to improve skin texture, dullness, and minor "
            "hyperpigmentation. Mild peeling for 2–4 days.",
            3000, 4, False
        ),
        (
            "Chemical Peel – Medium (Jessner's or TCA 20–35%)",
            "Combination or trichloroacetic acid peel reaching the papillary dermis. "
            "Effective for pigmentation, moderate wrinkles, and superficial acne scars. "
            "5–7 days social downtime.",
            6000, 3, True
        ),
        (
            "Chemical Peel – Deep (TCA 50% / Phenol-Croton Oil)",
            "Full-face phenol peel or high-concentration TCA for severe photo-damage, "
            "deep wrinkles, and acne scars. Requires sedation monitoring protocol. "
            "10–14 days healing.",
            25000, 1, True
        ),
        (
            "VI Peel – Advanced Brightening",
            "Medical-grade VI Peel formulation with TCA, phenol, salicylic, and retinoic acid "
            "for brightening, hyperpigmentation, and anti-aging. Self-neutralising.",
            8000, 1, True
        ),
        (
            "Microneedling (Dermapen) – Face",
            "Automated fractional needling at depths of 0.5–2.5mm to create controlled micro-"
            "injuries, stimulate collagen, and improve skin texture, scars, and pores.",
            5000, 3, True
        ),
        (
            "Microneedling (Dermapen) – Face + PRP",
            "Microneedling combined with autologous platelet-rich plasma to enhance "
            "healing and maximise collagen induction. Requires blood draw.",
            9000, 3, True
        ),
        (
            "PRP Facial (Vampire Facial)",
            "Topically applied PRP activated with the patient's own plasma immediately after "
            "microneedling or laser. Anti-aging and skin quality improvement.",
            8000, 3, True
        ),
        (
            "Mesotherapy – Skin Booster (Hyaluronic Acid)",
            "Superficial multi-point microinjections of hydrating HA cocktail to improve skin "
            "glow, hydration, and elasticity. Series of 3 sessions monthly.",
            6000, 3, True
        ),
        (
            "Profhilo Bioremodelling (2-Point Injection)",
            "High-concentration NAHYCO HA biostimulator injected at BAP points to restructure "
            "skin from within. Two sessions one month apart.",
            18000, 2, True
        ),
        (
            "Salmon DNA (PDRN) Skin Rejuvenation",
            "Polynucleotide (PDRN) injections to stimulate tissue repair, anti-inflammation, "
            "and skin regeneration. Effective for dark circles and overall rejuvenation.",
            7000, 4, True
        ),
        (
            "LED Light Therapy – Full Face",
            "Photobiomodulation using combined red (633nm) and near-infrared (830nm) LEDs to "
            "stimulate mitochondrial activity, collagen production, and reduce inflammation. "
            "No downtime.",
            2000, 6, False
        ),
        (
            "Dermaplaning",
            "Manual mechanical exfoliation using a 10R surgical scalpel to remove dead skin "
            "cells and vellus hair (peach fuzz). Leaves skin ultra-smooth. "
            "Often combined with chemical peel.",
            2500, 1, False
        ),
    ]),

    ("Acne & Hyperpigmentation", [
        (
            "Acne Consultation + Comedone Extraction",
            "Medical consultation for acne with clinical comedone and pustule extraction "
            "using sterile instruments under magnification. Topical numbing applied if required.",
            2000, 1, True
        ),
        (
            "Intralesional Triamcinolone – Nodular Acne",
            "Corticosteroid injection directly into large inflammatory acne cysts or nodules "
            "to reduce inflammation and prevent scarring. 2.5–10 mg/ml concentration.",
            1500, 1, True
        ),
        (
            "Salicylic Acid Peels for Active Acne",
            "20–30% salicylic acid peel targeting follicular keratinisation and sebaceous "
            "activity. Anti-comedogenic and bacteriostatic action. Monthly series.",
            3000, 4, False
        ),
        (
            "Pigmentation Treatment – Melasma (Combination Protocol)",
            "Structured 3-modality melasma treatment combining topical lightening agents "
            "(applied pre-procedure), low-fluence Nd:YAG laser, and a brightening mask. "
            "Monthly sessions; must be combined with SPF 50+ daily.",
            6500, 6, True
        ),
        (
            "Obagi Blue Peel Radiance",
            "Salicylic, lactic, and citric acid superficial peel for sun damage, uneven tone, "
            "mild hyperpigmentation, and texture. No pre-conditioning required.",
            4500, 4, False
        ),
        (
            "Post-Inflammatory Hyperpigmentation (PIH) Treatment",
            "Combined protocol using chemical peeling, targeted laser (510nm dye or Q-YAG), "
            "and prescribed homecare to fade PIH marks post-acne or trauma. "
            "4–6 sessions usually required.",
            5000, 6, True
        ),
    ]),

    ("Hair & Scalp Treatments", [
        (
            "PRP (Platelet-Rich Plasma) – Scalp Injection",
            "Autologous PRP prepared by centrifugation and injected into the scalp dermis "
            "at 1 cm intervals to stimulate hair follicles and reduce shedding. "
            "Series of 3 sessions monthly, then maintenance.",
            8000, 3, True
        ),
        (
            "Exosome Hair Therapy",
            "Scalp injection of stem-cell-derived exosome complex to stimulate hair growth "
            "and scalp regeneration. Emerging evidence for androgenetic alopecia.",
            12000, 3, True
        ),
        (
            "Low-Level Laser Therapy (LLLT) – Scalp",
            "655nm diode laser helmet or cap stimulates hair follicle activity through "
            "photobiomodulation. Non-invasive with no downtime.",
            2500, 12, False
        ),
        (
            "Scalp Mesotherapy (DHT Blocker Cocktail)",
            "Microinjections of dutasteride, biotin, and peptide cocktail into the scalp "
            "to reduce dihydrotestosterone locally and stimulate follicular activity.",
            6000, 6, True
        ),
        (
            "Dandruff / Seborrheic Dermatitis Treatment Session",
            "Clinical scalp cleanse with keratolytic shampoo application (ketoconazole/zinc), "
            "UV-B phototherapy, and anti-fungal serum application. Monthly maintenance.",
            2000, 4, True
        ),
    ]),

    ("Body & Contouring", [
        (
            "Slimming Wrap – Full Body",
            "Inch-loss body wrap using thermal bandages infused with slimming actives "
            "(caffeine, carnitine, aminophylline). Stimulates lymphatic drainage.",
            4000, 6, False
        ),
        (
            "Wood Therapy – Cellulite Reduction",
            "Manual manipulation technique using wooden rollers and cups to break up "
            "adipose tissue, improve lymphatic flow, and reduce cellulite appearance.",
            2500, 8, False
        ),
        (
            "Pressotherapy (Lymphatic Drainage Suit)",
            "Sequential pneumatic compression therapy to reduce fluid retention, "
            "oedema, and improve lymphatic circulation. 30-minute sessions.",
            2000, 8, False
        ),
        (
            "EMS (Electromagnetic Muscle Stimulation) – Abdomen",
            "High-intensity focused electromagnetic device to induce supramaximal muscle "
            "contractions equivalent to 20,000 sit-ups per session. Fat reduction + "
            "muscle building.",
            10000, 4, False
        ),
        (
            "Cavitation Ultrasound – Single Area",
            "40 kHz ultrasound cavitation to disrupt fat cell membranes for localised "
            "fat reduction. Liver and kidneys process released lipids.",
            4000, 6, False
        ),
        (
            "Stretch Mark Treatment (RF + Microneedling)",
            "Combined radiofrequency microneedling applied to stretch marks to stimulate "
            "collagen remodelling and improve appearance of striae.",
            7000, 4, True
        ),
    ]),

    ("Minor Surgical & Dermatological Procedures", [
        (
            "Mole Removal – Shave Excision (per lesion)",
            "Shave excision of a raised benign melanocytic naevus under local anaesthesia "
            "with electrocautery haemostasis. Histopathology included.",
            3000, 1, True
        ),
        (
            "Wart / Verruca Treatment – Cryotherapy",
            "Liquid nitrogen cryotherapy applied to verruca or common warts until "
            "a 2mm ice-ball margin achieved. May require 2–4 sessions.",
            1500, 3, True
        ),
        (
            "Skin Tag Removal (Electrosurgery) – up to 5 tags",
            "Electrocautery or radiofrequency ablation of benign pedunculated skin tags. "
            "Local anaesthetic cream applied 45 minutes prior.",
            2000, 1, True
        ),
        (
            "Lipoma Excision – Small (<3cm)",
            "Surgical excision of a benign subcutaneous lipoma under local anaesthesia "
            "with absorbable suture closure. Specimen sent for histopathology.",
            8000, 1, True
        ),
        (
            "Sebaceous Cyst Excision",
            "Complete surgical excision of the cyst and wall to prevent recurrence. "
            "Local anaesthesia, layered closure. Histopathology included.",
            7000, 1, True
        ),
        (
            "Ingrown Toenail Correction (Selective Lateral Matricectomy)",
            "Partial lateral nail plate avulsion followed by phenol matricectomy to prevent "
            "nail edge regrowth. Local anaesthetic block. Success rate > 95%.",
            4500, 1, True
        ),
        (
            "Abscess Incision & Drainage (I&D)",
            "Surgical incision, blunt dissection, and complete drainage of a localised "
            "cutaneous abscess under local anaesthesia. Wound packing applied if required.",
            3500, 1, True
        ),
        (
            "Patch Test – Contact Allergen Panel (25 allergens)",
            "Clinical epicutaneous patch testing using a 25-allergen British standard series "
            "to identify specific contact allergens. Reading at Day 2 and Day 4.",
            5000, 1, True
        ),
        (
            "Platelet-Rich Plasma (PRP) – Keloid / Scar Injection",
            "Autologous PRP combined with fractional laser or alone, injected into hypertrophic "
            "or keloid scar tissue to soften texture and reduce erythema.",
            7000, 3, True
        ),
    ]),
]


class Command(BaseCommand):
    help = 'Seed comprehensive aesthetic clinic procedure catalog with categories and full descriptions'

    def handle(self, *args, **kwargs):
        org = Organization.objects.first()
        if not org:
            self.stdout.write(self.style.ERROR('No organization found. Run seed_demo_data first.'))
            return

        cat_count = 0
        proc_count = 0

        for cat_name, procedures in PROCEDURE_CATALOG:
            category, cat_created = ProcedureCategory.objects.get_or_create(
                organization=org, name=cat_name
            )
            if cat_created:
                cat_count += 1

            for name, description, base_price, default_sessions, consult_req in procedures:
                _, proc_created = ProcedureType.objects.get_or_create(
                    organization=org,
                    name=name,
                    defaults={
                        'category': category,
                        'description': description,
                        'base_price': base_price,
                        'expected_default_sessions': default_sessions,
                        'consultation_required': consult_req,
                    }
                )
                if proc_created:
                    proc_count += 1

            self.stdout.write(f'  ✓ {cat_name} — done')

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully seeded:'
            f'\n  • {cat_count} new procedure categories'
            f'\n  • {proc_count} new procedure types'
        ))
