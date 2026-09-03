import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.session import Base, SessionLocal, engine
from app.models.species import Species

SPECIES = [
    dict(id="african-lion", name="African Lion", scientific_name="Panthera leo", category="Mammal",
         conservation_status="Vulnerable", class_name="Mammalia", family="Felidae",
         lifespan="10-14 years (wild)", size="170-250 cm body length", weight="120-190 kg", diet_type="Carnivore",
         habitat="Grassland, savanna, and open woodland across Sub-Saharan Africa, with a single remnant population in India's Gir Forest.",
         diet_text="Hunts in coordinated prides — wildebeest, zebra, and buffalo are primary prey.",
         conservation_text="Population has declined by ~43% since the early 1990s due to habitat loss and human conflict.",
         facts=["A pride's roar can be heard from 8 km away.", "Lionesses do 85-90% of the pride's hunting.", "Males can sleep up to 20 hours a day."]),
    dict(id="snow-leopard", name="Snow Leopard", scientific_name="Panthera uncia", category="Mammal",
         conservation_status="Vulnerable", class_name="Mammalia", family="Felidae",
         lifespan="15-18 years (wild)", size="75-150 cm body length", weight="22-55 kg", diet_type="Carnivore",
         habitat="High-altitude alpine zones of Central and South Asia, 3,000-4,500 m elevation.",
         diet_text="Preys on blue sheep, ibex, and marmots across steep mountain terrain.",
         conservation_text="Fewer than 10,000 mature individuals remain, threatened by poaching and habitat fragmentation.",
         facts=["Cannot roar — makes a distinctive chuff-like call.", "Tail can equal body length, used for balance.", "Leaps up to 15 metres in a single bound."]),
    dict(id="blue-morpho", name="Blue Morpho Butterfly", scientific_name="Morpho peleides", category="Insect",
         conservation_status="Least Concern", class_name="Insecta", family="Nymphalidae",
         lifespan="2-4 weeks (adult)", size="7.5-20 cm wingspan", weight="< 1 g", diet_type="Nectarivore",
         habitat="Lowland tropical rainforest across Central and South America.",
         diet_text="Adults sip fermenting fruit juice and tree sap; caterpillars feed on legumes.",
         conservation_text="Locally abundant, though deforestation threatens habitat in parts of its range.",
         facts=["Iridescent blue comes from scale structure, not pigment.", "Underwings are dull for camouflage at rest.", "Flash-and-vanish flight confuses predators."]),
    dict(id="red-fox", name="Red Fox", scientific_name="Vulpes vulpes", category="Mammal",
         conservation_status="Least Concern", class_name="Mammalia", family="Canidae",
         lifespan="3-6 years (wild)", size="45-90 cm body length", weight="3.6-6.8 kg", diet_type="Omnivore",
         habitat="Forests, grasslands, mountains, and increasingly urban edges across the Northern Hemisphere.",
         diet_text="Opportunistic — small mammals, birds, insects, fruit, and human food scraps.",
         conservation_text="Population stable and expanding into urban habitats worldwide.",
         facts=["Can hear a watch ticking 40 m away.", "Uses Earth's magnetic field to judge pounces.", "Has over 40 distinct vocalisations."]),
    dict(id="white-tailed-deer", name="White-tailed Deer", scientific_name="Odocoileus virginianus", category="Mammal",
         conservation_status="Least Concern", class_name="Mammalia", family="Cervidae",
         lifespan="6-14 years (wild)", size="95-220 cm body length", weight="34-136 kg", diet_type="Herbivore",
         habitat="Forest edges, meadows, and farmland across the Americas.",
         diet_text="Browses leaves, twigs, fruit, nuts, and agricultural crops seasonally.",
         conservation_text="Abundant across most of its range, with populations exceeding historic norms in places.",
         facts=["Raises its tail as a white flag to warn the herd.", "Fawns are scent-free at birth.", "Antlers regrow annually."]),
    dict(id="great-horned-owl", name="Great Horned Owl", scientific_name="Bubo virginianus", category="Bird",
         conservation_status="Least Concern", class_name="Aves", family="Strigidae",
         lifespan="10-15 years (wild)", size="46-63 cm", weight="0.9-2.5 kg", diet_type="Carnivore",
         habitat="Forests, deserts, wetlands, and suburban parks across the Americas.",
         diet_text="Apex nocturnal hunter — rabbits, skunks, and other raptors.",
         conservation_text="Stable populations, benefiting from adaptability to altered landscapes.",
         facts=["Grip severs a rabbit's spine instantly.", "Rotates its head up to 270 degrees.", "\"Horns\" are feather tufts, not ears."]),
    dict(id="green-sea-turtle", name="Green Sea Turtle", scientific_name="Chelonia mydas", category="Reptile",
         conservation_status="Endangered", class_name="Reptilia", family="Cheloniidae",
         lifespan="70-80 years", size="80-150 cm shell length", weight="110-190 kg", diet_type="Herbivore",
         habitat="Tropical and subtropical coastlines, seagrass beds, and coral reefs worldwide.",
         diet_text="Adults graze almost exclusively on seagrass and algae.",
         conservation_text="Endangered from bycatch, coastal development, and historic overharvesting of eggs.",
         facts=["Can hold its breath for up to 5 hours while resting.", "Returns to its natal beach to nest.", "Named for the green fat beneath its shell, not its colour."]),
    dict(id="humpback-whale", name="Humpback Whale", scientific_name="Megaptera novaeangliae", category="Marine",
         conservation_status="Least Concern", class_name="Mammalia", family="Balaenopteridae",
         lifespan="45-100 years", size="12-16 m", weight="25,000-40,000 kg", diet_type="Filter feeder",
         habitat="All major oceans — feeds in polar waters, breeds and calves in tropical waters.",
         diet_text="Filters krill and small schooling fish using baleen plates, often via bubble-net hunting.",
         conservation_text="Recovered significantly since the 1986 whaling moratorium; some subpopulations remain at risk.",
         facts=["Songs can travel across entire ocean basins.", "Migrates up to 8,000 km annually.", "Pectoral fins can reach 5 m long."]),
    dict(id="american-bison", name="American Bison", scientific_name="Bison bison", category="Mammal",
         conservation_status="Near Threatened", class_name="Mammalia", family="Bovidae",
         lifespan="15-20 years (wild)", size="2-3.5 m body length", weight="400-1,000 kg", diet_type="Herbivore",
         habitat="Prairie grasslands and river valleys of North America.",
         diet_text="Grazes almost exclusively on native grasses and sedges.",
         conservation_text="Recovered from fewer than 1,000 individuals through conservation herds.",
         facts=["Can sprint up to 55 km/h.", "Wallows in dust to deter insects.", "Once numbered over 30 million."]),
    dict(id="poison-dart-frog", name="Poison Dart Frog", scientific_name="Dendrobates tinctorius", category="Amphibian",
         conservation_status="Least Concern", class_name="Amphibia", family="Dendrobatidae",
         lifespan="4-6 years (wild)", size="2.5-5 cm", weight="< 30 g", diet_type="Insectivore",
         habitat="Humid lowland rainforest floors of South America.",
         diet_text="Feeds on ants, termites, and small invertebrates that contribute to its toxicity.",
         conservation_text="Stable in protected rainforest, though habitat loss threatens regional populations.",
         facts=["Toxicity comes from its diet — captive-bred frogs aren't poisonous.", "Bright colouring warns predators.", "Some species carry tadpoles to individual water pools."]),
    dict(id="clownfish", name="Clownfish", scientific_name="Amphiprion ocellaris", category="Fish",
         conservation_status="Least Concern", class_name="Actinopterygii", family="Pomacentridae",
         lifespan="6-10 years (wild)", size="8-11 cm", weight="< 250 g", diet_type="Omnivore",
         habitat="Coral reefs of the Indo-Pacific, always paired with a host sea anemone.",
         diet_text="Eats algae, zooplankton, and anemone leftovers in a mutualistic relationship.",
         conservation_text="Stable in the wild, though reef degradation and the aquarium trade are regional pressures.",
         facts=["A mucus coating makes it immune to anemone stings.", "All clownfish are born male.", "Rarely strays far from its host anemone."]),
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        added = 0
        for row in SPECIES:
            row = dict(row)
            facts = row.pop("facts")
            if db.get(Species, row["id"]):
                continue
            db.add(Species(**row, facts=json.dumps(facts)))
            added += 1
        db.commit()
        print(f"Seeded {added} species ({len(SPECIES) - added} already present, skipped).")
    finally:
        db.close()


if __name__ == "__main__":
    run()
