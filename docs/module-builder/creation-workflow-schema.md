# Creation workflow schema

Creation flows reference the same reusable component IDs and character paths as sheet templates. Each flow has a stable ID, start step, ordered stable steps, component references, conditional labeled transitions, and optional review steps.

Activation validates component references, transition targets, reachability, cycles without exits, rule references, and path types. Runtime progress is resumable character-owned state. Preview uses an isolated sample character and never writes production records.

The visual editor must provide step add, rename, reorder, duplicate, delete, component assignment, transition target and condition editing, review designation, and start-step selection without requiring JSON.
