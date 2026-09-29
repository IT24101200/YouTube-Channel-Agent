# Database initialization and sample data seeding
# Follows student rules: includes small amount of realistic sample data

from app.db.database import engine, Base, SessionLocal
from app.db.models import Owner, Channel, ChannelBrief, Idea, Script, EvidenceItem, ResearchRun

def init_db():
    """Create all tables and seed starter data if empty."""
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_owner = db.query(Owner).first()
        if existing_owner:
            return

        # 1. Create Default Owner
        owner = Owner(
            login_subject="ayeshmantha@local",
            display_name="Ayeshmantha"
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)

        # 2. Create Default Channel
        channel = Channel(
            owner_id=owner.id,
            youtube_channel_id="UC_CLEARTECH_DEMO",
            name_snapshot="ClearTech Minute",
            timezone="Asia/Colombo",
            mode="draft",
            pause_production=False,
            pause_publishing=False
        )
        db.add(channel)
        db.commit()
        db.refresh(channel)

        # 3. Create Channel Brief
        brief = ChannelBrief(
            channel_id=channel.id,
            name="ClearTech Minute",
            handle="@ClearTechMinute",
            viewer_promise="One useful technology idea, explained clearly in about a minute.",
            audience="technology_beginners",
            language="en",
            pillars=["Everyday Tech", "AI Basics", "Practical Digital Safety"],
            style_guidelines="Clear, friendly, non-intimidating, high-contrast visuals, 35-60s duration."
        )
        db.add(brief)

        # 4. Seed a Research Run with Evidence
        research = ResearchRun(
            channel_id=channel.id,
            status="completed",
            query_topic="Everyday AI & Digital Tech Explained Simply",
            findings={
                "niche_recommendation": "Everyday AI and technology explained",
                "target_audience": "Students and beginners",
                "fit_score": 90,
                "evidence_strength": "High"
            },
            limitations="Assumes English-speaking audience. Sinhala localization can be tested as a later expansion."
        )
        db.add(research)
        db.commit()
        db.refresh(research)

        # Seed Evidence Items
        ev1 = EvidenceItem(
            research_run_id=research.id,
            source_url="https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Introduction",
            title="Introduction to web APIs - MDN Web Docs",
            publisher="Mozilla Developer Network",
            short_extract="Application Programming Interfaces (APIs) are constructs made available in programming languages to allow developers to create complex functionality more easily. They abstract more complex code away from you."
        )
        ev2 = EvidenceItem(
            research_run_id=research.id,
            source_url="https://cloud.google.com/learn/what-is-an-api",
            title="What is an API? - Google Cloud Guides",
            publisher="Google Cloud",
            short_extract="An API connects different software systems so they can exchange data and perform requested operations without exposing internal implementation details."
        )
        db.add_all([ev1, ev2])

        # 5. Seed 5 Realistic Ideas (From Build Plan Section 21)
        idea1 = Idea(
            channel_id=channel.id,
            pillar="Everyday Tech",
            question="What is an API?",
            original_angle="Use a restaurant waiter analogy: you don't enter the kitchen yourself, you make an order and receive your food safely.",
            status="scripted",
            editorial_fit_score=92
        )
        idea2 = Idea(
            channel_id=channel.id,
            pillar="Everyday Tech",
            question="What happens after you scan a QR code?",
            original_angle="Move from visible black-and-white pattern to interpreted web URL or payment token.",
            status="new",
            editorial_fit_score=88
        )
        idea3 = Idea(
            channel_id=channel.id,
            pillar="Everyday Tech",
            question="What is 'the cloud'?",
            original_angle="It's not floating in the sky—it's simply someone else's secure, always-on computer in a data center.",
            status="new",
            editorial_fit_score=85
        )
        idea4 = Idea(
            channel_id=channel.id,
            pillar="AI Basics",
            question="Why can an AI answer sound confident and still be wrong?",
            original_angle="Explain how LLMs predict the most likely next word rather than checking factual truth in the real world.",
            status="new",
            editorial_fit_score=94
        )
        idea5 = Idea(
            channel_id=channel.id,
            pillar="Everyday Tech",
            question="What is the difference between RAM and storage?",
            original_angle="Compare RAM to your office desk where you work right now, and storage to a filing cabinet across the room.",
            status="new",
            editorial_fit_score=90
        )
        db.add_all([idea1, idea2, idea3, idea4, idea5])
        db.commit()
        db.refresh(idea1)

        # 6. Seed a Complete Script for Idea 1 ("What is an API?")
        script1 = Script(
            idea_id=idea1.id,
            version=1,
            learning_goal="Understand that an API is a secure messenger between two different apps.",
            title_options=[
                "What is an API in 45 Seconds?",
                "How Apps Talk to Each Other (APIs Explained)",
                "The Waiter Analogy: What is an API?"
            ],
            narration=(
                "Have you ever wondered how your weather app knows it's raining outside right now? "
                "The app didn't build its own weather satellite. Instead, it uses an API! "
                "Think of an API like a waiter at a restaurant. You are the customer sitting at the table. "
                "The kitchen is a giant weather database full of radar data. "
                "You cannot just walk into the kitchen and touch their cooking equipment. "
                "Instead, you give your order to the waiter. The waiter walks into the kitchen, gets your weather report, and brings it back to your table. "
                "An API is that waiter for software! It lets apps talk to each other safely, without sharing private system secrets."
            ),
            claims=[
                {
                    "claim_id": "c1",
                    "text": "Weather apps typically fetch remote meteorological data via external web APIs rather than maintaining independent satellites.",
                    "source_ids": [ev1.id],
                    "verification_status": "verified"
                },
                {
                    "claim_id": "c2",
                    "text": "APIs provide a controlled abstraction layer that prevents direct access to internal database systems.",
                    "source_ids": [ev2.id],
                    "verification_status": "verified"
                }
            ],
            scenes=[
                {
                    "scene_id": "s1",
                    "narration_segment": "Have you ever wondered how your weather app knows it's raining outside right now? The app didn't build its own weather satellite.",
                    "visual_brief": "A smartphone showing a weather widget with rain drops and a satellite in orbit.",
                    "on_screen_text": "How does your phone know the weather?",
                    "target_duration_seconds": 8
                },
                {
                    "scene_id": "s2",
                    "narration_segment": "Instead, it uses an API! Think of an API like a waiter at a restaurant. You are the customer sitting at the table.",
                    "visual_brief": "Cozy restaurant setting with a friendly waiter holding a notepad next to a table.",
                    "on_screen_text": "An API is like a waiter",
                    "target_duration_seconds": 10
                },
                {
                    "scene_id": "s3",
                    "narration_segment": "The kitchen is a giant weather database full of radar data. You cannot just walk into the kitchen. The waiter brings your order safely.",
                    "visual_brief": "Split screen: customer table on the left, high-tech server kitchen on the right.",
                    "on_screen_text": "Apps talk safely through the waiter",
                    "target_duration_seconds": 14
                },
                {
                    "scene_id": "s4",
                    "narration_segment": "An API is that waiter for software! It lets apps talk to each other safely, without sharing private system secrets.",
                    "visual_brief": "Two smartphones exchanging a glowing envelope with a checkmark badge.",
                    "on_screen_text": "Safe, connected software",
                    "target_duration_seconds": 8
                }
            ],
            verification_status="verified",
            owner_edited=False
        )
        db.add(script1)
        db.commit()

    finally:
        db.close()
