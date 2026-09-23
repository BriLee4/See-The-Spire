export default defineEventHandler(async(event)=>{
    const db = useDatabase("myDatabase");

    const relics = await db.sql`SELECT count(*) FROM relics`;
    return relics.rows;
});