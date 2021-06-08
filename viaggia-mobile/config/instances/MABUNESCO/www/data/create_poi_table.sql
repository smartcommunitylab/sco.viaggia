CREATE TABLE IF NOT EXISTS poi_data (
	id int,
	address varchar,
	title_it varchar,
	title_en varchar,
    abstract_it varchar,
	abstract_en varchar,
    description_it varchar,
	description_en varchar,
    web varchar, 
    image_uri varchar, 
    geometry_type varchar, 
    geometry_latitude varchar, 
    geometry_longitude varchar, 
    class_identifier: varchar,
    mainNodeId: varchar,
    updated timestamp default now()
)

