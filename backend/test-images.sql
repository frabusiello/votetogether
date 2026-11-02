-- Test images hotlinked from Wikimedia Commons, plus 4 new items per quiz. Dev only:
-- the seed doesn't know about any of this yet. Safe to run more than once.
-- Run from backend/: psql "$VOTE_TOGETHER_PG_URL" -f test-images.sql
begin;

-- pizza-toppings
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/%E0%B4%95%E0%B5%88%E0%B4%A4%E0%B4%9A%E0%B5%8D%E0%B4%9A%E0%B4%95%E0%B5%8D%E0%B4%95.jpg/960px-%E0%B4%95%E0%B5%88%E0%B4%A4%E0%B4%9A%E0%B5%8D%E0%B4%9A%E0%B4%95%E0%B5%8D%E0%B4%95.jpg', 'Suniltg at Malayalam Wikipedia', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:%E0%B4%95%E0%B5%88%E0%B4%A4%E0%B4%9A%E0%B5%8D%E0%B4%9A%E0%B4%95%E0%B5%8D%E0%B4%95.jpg')
  where name = 'Pineapple' and quiz_id = (select id from quizzes where slug = 'pizza-toppings');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Canned_anchovies_-_bought_in_Japan_-_2024_May_9.jpeg/960px-Canned_anchovies_-_bought_in_Japan_-_2024_May_9.jpeg', 'Nesnad', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Canned_anchovies_-_bought_in_Japan_-_2024_May_9.jpeg')
  where name = 'Anchovies' and quiz_id = (select id from quizzes where slug = 'pizza-toppings');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/2016-01_Agaricus_bisporus_03.jpg/960px-2016-01_Agaricus_bisporus_03.jpg', '0x010C', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2016-01_Agaricus_bisporus_03.jpg')
  where name = 'Mushrooms' and quiz_id = (select id from quizzes where slug = 'pizza-toppings');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Deep_pan_pepperoni_-_Grind_%26_Slice_2024-04-22.jpg/960px-Deep_pan_pepperoni_-_Grind_%26_Slice_2024-04-22.jpg', 'Andy Li', 'CC0', 'https://commons.wikimedia.org/wiki/File:Deep_pan_pepperoni_-_Grind_%26_Slice_2024-04-22.jpg')
  where name = 'Pepperoni' and quiz_id = (select id from quizzes where slug = 'pizza-toppings');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Black_olive_on_a_white_surface.jpg/960px-Black_olive_on_a_white_surface.jpg', 'Revital Salomon', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Black_olive_on_a_white_surface.jpg')
  where name = 'Olives' and quiz_id = (select id from quizzes where slug = 'pizza-toppings');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Bowl_of_jalape%C3%B1os.jpg/960px-Bowl_of_jalape%C3%B1os.jpg', 'Geo Lightspeed7', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Bowl_of_jalape%C3%B1os.jpg')
  where name = 'Jalapeños' and quiz_id = (select id from quizzes where slug = 'pizza-toppings');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Ham', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Sliced_cooked_ham.jpg/960px-Sliced_cooked_ham.jpg', 'Anna.Massini', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Sliced_cooked_ham.jpg'
  from quizzes q
  where slug = 'pizza-toppings' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Ham');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Sweetcorn', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Sweet_Corns.jpg/960px-Sweet_Corns.jpg', 'HitroMilanese', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Sweet_Corns.jpg'
  from quizzes q
  where slug = 'pizza-toppings' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Sweetcorn');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Rocket', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Coleslaw_with_rocket_%28arugula%29_and_lemon_dressing.jpg/960px-Coleslaw_with_rocket_%28arugula%29_and_lemon_dressing.jpg', 'Horacio Cambeiro', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Coleslaw_with_rocket_(arugula)_and_lemon_dressing.jpg'
  from quizzes q
  where slug = 'pizza-toppings' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Rocket');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Red onion', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Three_whole_red_onions.jpg/960px-Three_whole_red_onions.jpg', 'Anja', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Three_whole_red_onions.jpg'
  from quizzes q
  where slug = 'pizza-toppings' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Red onion');

-- foods (Cheese keeps its local /images/foods/cheese.jpg)
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Sushi_Plate_in_Organic_Sushi_Prague_4.jpg/960px-Sushi_Plate_in_Organic_Sushi_Prague_4.jpg', 'Mojmir Churavy', 'CC0', 'https://commons.wikimedia.org/wiki/File:Sushi_Plate_in_Organic_Sushi_Prague_4.jpg')
  where name = 'Sushi' and quiz_id = (select id from quizzes where slug = 'foods');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Brussels_sprouts_on_white_background_5849.jpg/960px-Brussels_sprouts_on_white_background_5849.jpg', 'Amada44', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Brussels_sprouts_on_white_background_5849.jpg')
  where name = 'Brussels sprouts' and quiz_id = (select id from quizzes where slug = 'foods');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/960px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg', 'Larry Miller', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:001_Tacos_de_carnitas,_carne_asada_y_al_pastor.jpg')
  where name = 'Tacos' and quiz_id = (select id from quizzes where slug = 'foods');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/LiquoriceAllsorts2003.jpg/960px-LiquoriceAllsorts2003.jpg', null, 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:LiquoriceAllsorts2003.jpg')
  where name = 'Liquorice' and quiz_id = (select id from quizzes where slug = 'foods');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Avocado_Hass_-_single_and_halved.jpg/960px-Avocado_Hass_-_single_and_halved.jpg', 'Ivar Leidus', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Avocado_Hass_-_single_and_halved.jpg')
  where name = 'Avocado' and quiz_id = (select id from quizzes where slug = 'foods');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Marmite', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Marmite_thick_spread_toasted_bread.jpg/960px-Marmite_thick_spread_toasted_bread.jpg', 'TheJackal', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Marmite_thick_spread_toasted_bread.jpg'
  from quizzes q
  where slug = 'foods' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Marmite');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Oysters', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Plate_of_oysters_with_lemon.jpg/960px-Plate_of_oysters_with_lemon.jpg', 'Wilfredor', 'CC0', 'https://commons.wikimedia.org/wiki/File:Plate_of_oysters_with_lemon.jpg'
  from quizzes q
  where slug = 'foods' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Oysters');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Durian', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Durian_fruit_singapore.jpg/960px-Durian_fruit_singapore.jpg', 'G.Mannaerts', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Durian_fruit_singapore.jpg'
  from quizzes q
  where slug = 'foods' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Durian');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Coriander', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Coriander_Leaves.jpg/960px-Coriander_Leaves.jpg', 'Rupeshm364', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Coriander_Leaves.jpg'
  from quizzes q
  where slug = 'foods' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Coriander');

-- movies (no posters on Commons, so these are loosely related photos)
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Keanu_Reeves_and_Carrie_Ann_Moss_shoot_motorcycle_scene_for_Matrix_4.jpg/960px-Keanu_Reeves_and_Carrie_Ann_Moss_shoot_motorcycle_scene_for_Matrix_4.jpg', 'Jdlrobson', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Keanu_Reeves_and_Carrie_Ann_Moss_shoot_motorcycle_scene_for_Matrix_4.jpg')
  where name = 'The Matrix' and quiz_id = (select id from quizzes where slug = 'movies');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/RMS_Titanic_3.jpg/960px-RMS_Titanic_3.jpg', 'Francis Godolphin Osbourne Stuart', 'Public domain', 'https://commons.wikimedia.org/wiki/File:RMS_Titanic_3.jpg')
  where name = 'Titanic' and quiz_id = (select id from quizzes where slug = 'movies');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://upload.wikimedia.org/wikipedia/commons/f/f0/Yoma97.jpg', 'Starkiller50187', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Yoma97.jpg')
  where name = 'Shrek' and quiz_id = (select id from quizzes where slug = 'movies');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Francis_Ford_Coppola_%285979851131%29.jpg/960px-Francis_Ford_Coppola_%285979851131%29.jpg', 'Gerald Geronimo', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Francis_Ford_Coppola_(5979851131).jpg')
  where name = 'The Godfather' and quiz_id = (select id from quizzes where slug = 'movies');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://upload.wikimedia.org/wikipedia/commons/c/cb/ABBA_-_TopPop_1974_5.png', 'AVRO', 'CC BY-SA 3.0 nl', 'https://commons.wikimedia.org/wiki/File:ABBA_-_TopPop_1974_5.png')
  where name = 'Mamma Mia!' and quiz_id = (select id from quizzes where slug = 'movies');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Tsintaosaurus_spinorhinus_%26_Tyrannosaurus_Rex.jpg/960px-Tsintaosaurus_spinorhinus_%26_Tyrannosaurus_Rex.jpg', 'Gary Todd', 'CC0', 'https://commons.wikimedia.org/wiki/File:Tsintaosaurus_spinorhinus_%26_Tyrannosaurus_Rex.jpg')
  where name = 'Jurassic Park' and quiz_id = (select id from quizzes where slug = 'movies');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Star Wars', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Stormtrooper_%2852921606350%29.jpg/960px-Stormtrooper_%2852921606350%29.jpg', 'Steven Miller', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Stormtrooper_(52921606350).jpg'
  from quizzes q
  where slug = 'movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Star Wars');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Toy Story', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Dragon_Con_2013_-_Woody_%26_Buzz_%289680585982%29.jpg/960px-Dragon_Con_2013_-_Woody_%26_Buzz_%289680585982%29.jpg', 'Pat Loika', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Dragon_Con_2013_-_Woody_%26_Buzz_(9680585982).jpg'
  from quizzes q
  where slug = 'movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Toy Story');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'The Lion King', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Lion_%28Panthera_leo%29_old_male_Chobe.jpg/960px-Lion_%28Panthera_leo%29_old_male_Chobe.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Lion_(Panthera_leo)_old_male_Chobe.jpg'
  from quizzes q
  where slug = 'movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'The Lion King');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Frozen', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Cosplay_of_Elsa_and_Anna_at_Made_in_Asia_2022_%2852120879165%29.jpg/960px-Cosplay_of_Elsa_and_Anna_at_Made_in_Asia_2022_%2852120879165%29.jpg', 'Kiri Karma', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Cosplay_of_Elsa_and_Anna_at_Made_in_Asia_2022_(52120879165).jpg'
  from quizzes q
  where slug = 'movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Frozen');

-- actors
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Tom_Hanks_1995_WH.jpg/960px-Tom_Hanks_1995_WH.jpg', 'Clinton Presidential Library', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Tom_Hanks_1995_WH.jpg')
  where name = 'Tom Hanks' and quiz_id = (select id from quizzes where slug = 'actors');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Meryl_Streep_-_Berlin_Berlinale_66_%2824609057279%29.jpg/960px-Meryl_Streep_-_Berlin_Berlinale_66_%2824609057279%29.jpg', 'www.GlynLowe.com from Hamburg, Germany', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Meryl_Streep_-_Berlin_Berlinale_66_(24609057279).jpg')
  where name = 'Meryl Streep' and quiz_id = (select id from quizzes where slug = 'actors');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://upload.wikimedia.org/wikipedia/commons/f/f0/Nicolas_Cage-close_up.jpg', 'Kristin', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Nicolas_Cage-close_up.jpg')
  where name = 'Nicolas Cage' and quiz_id = (select id from quizzes where slug = 'actors');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Reuni%C3%A3o_com_o_ator_norte-americano_Keanu_Reeves_%28cropped%29.jpg/960px-Reuni%C3%A3o_com_o_ator_norte-americano_Keanu_Reeves_%28cropped%29.jpg', 'Governo do Estado de São Paulo', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Reuni%C3%A3o_com_o_ator_norte-americano_Keanu_Reeves_(cropped).jpg')
  where name = 'Keanu Reeves' and quiz_id = (select id from quizzes where slug = 'actors');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://upload.wikimedia.org/wikipedia/commons/f/f3/Zendaya_2019_by_Glenn_Francis_%28cropped%29.jpg', 'Toglenn', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Zendaya_2019_by_Glenn_Francis_(cropped).jpg')
  where name = 'Zendaya' and quiz_id = (select id from quizzes where slug = 'actors');
update items set (image_url, image_author, image_licence, image_source_url) =
  ('https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Jim_Carrey_2020.jpg/960px-Jim_Carrey_2020.jpg', 'SHOWTIME', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Jim_Carrey_2020.jpg')
  where name = 'Jim Carrey' and quiz_id = (select id from quizzes where slug = 'actors');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Denzel Washington', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Denzel_Washington_%282106641898%29.jpg/960px-Denzel_Washington_%282106641898%29.jpg', 'Alan Light', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Denzel_Washington_(2106641898).jpg'
  from quizzes q
  where slug = 'actors' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Denzel Washington');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Emma Thompson', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Emma_Thompson%2C_2022.jpg/960px-Emma_Thompson%2C_2022.jpg', 'Elena Ternovaja', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Emma_Thompson,_2022.jpg'
  from quizzes q
  where slug = 'actors' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Emma Thompson');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Leonardo DiCaprio', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Leonardo_DiCaprio_crop.jpg/960px-Leonardo_DiCaprio_crop.jpg', 'Thore Siebrands', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Leonardo_DiCaprio_crop.jpg'
  from quizzes q
  where slug = 'actors' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Leonardo DiCaprio');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Margot Robbie', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Margot_Robbie_%2828601016915%29.jpg/960px-Margot_Robbie_%2828601016915%29.jpg', 'Gage Skidmore from Peoria, AZ, United States of America', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Margot_Robbie_(28601016915).jpg'
  from quizzes q
  where slug = 'actors' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Margot Robbie');

commit;

-- New quizzes. Like the rest of this file, the seed doesn't know about them yet.
begin;

-- celebrity-men
insert into quizzes (slug, name) values ('celebrity-men', 'Celebrity crushes (men)') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Brad Pitt', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Brad_Pitt_PF.jpg/960px-Brad_Pitt_PF.jpg', 'Maggie from Palm Springs, United States', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Brad_Pitt_PF.jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Brad Pitt');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'George Clooney', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/George_Clooney_66%C3%A8me_Festival_de_Venise_%28Mostra%29_3Alt1.jpg/960px-George_Clooney_66%C3%A8me_Festival_de_Venise_%28Mostra%29_3Alt1.jpg', 'Nicolas Genin', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:George_Clooney_66%C3%A8me_Festival_de_Venise_(Mostra)_3Alt1.jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'George Clooney');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Idris Elba', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Idris_Elba_at_SXSW_London_2025_3.jpg/960px-Idris_Elba_at_SXSW_London_2025_3.jpg', 'Amy Martin Photography', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Idris_Elba_at_SXSW_London_2025_3.jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Idris Elba');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Timothée Chalamet', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Timoth%C3%A9e_Chalamet_in_London_2025.jpg/960px-Timoth%C3%A9e_Chalamet_in_London_2025.jpg', 'Amy Martin Photography', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Timoth%C3%A9e_Chalamet_in_London_2025.jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Timothée Chalamet');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Harry Styles', 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Harry_Styles_Denver_HsLot_2.jpg', 'Lovclyhes', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Harry_Styles_Denver_HsLot_2.jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Harry Styles');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Pedro Pascal', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Pedro_Pascal_at_the_2026_New_York_Film_Festival-043.jpg/960px-Pedro_Pascal_at_the_2026_New_York_Film_Festival-043.jpg', 'Bryan Berlin', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Pedro_Pascal_at_the_2026_New_York_Film_Festival-043.jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Pedro Pascal');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Ryan Gosling', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Ryan_Gosling_%2836067557491%29.jpg/960px-Ryan_Gosling_%2836067557491%29.jpg', 'Gage Skidmore from Peoria, AZ, United States of America', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Ryan_Gosling_(36067557491).jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Ryan Gosling');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'David Beckham', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/David_Beckham_UNICEF_%28cropped%29.jpg/960px-David_Beckham_UNICEF_%28cropped%29.jpg', 'Soccer Aid for Unicef', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:David_Beckham_UNICEF_(cropped).jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'David Beckham');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Jason Momoa', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Jason_Momoa%2C_Aquaman_%2845655623114%29.jpg/960px-Jason_Momoa%2C_Aquaman_%2845655623114%29.jpg', 'Eva Rinaldi from Sydney Australia', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Jason_Momoa,_Aquaman_(45655623114).jpg'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Jason Momoa');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Pete Davidson', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Pete_Davidson_portrait.png/960px-Pete_Davidson_portrait.png', 'LaVar James', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Pete_Davidson_portrait.png'
  from quizzes q
  where slug = 'celebrity-men' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Pete Davidson');

-- celebrity-women
insert into quizzes (slug, name) values ('celebrity-women', 'Celebrity crushes (women)') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Beyoncé', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Beyonc%C3%A9_and_Jay-Z_On_The_Run_II.jpg/960px-Beyonc%C3%A9_and_Jay-Z_On_The_Run_II.jpg', 'Erin McCormack', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Beyonc%C3%A9_and_Jay-Z_On_The_Run_II.jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Beyoncé');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Rihanna', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Rihanna_by_Rajasekharan_2019.jpg/960px-Rihanna_by_Rajasekharan_2019.jpg', 'Rajasekharan Parameswaran', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Rihanna_by_Rajasekharan_2019.jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Rihanna');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Jennifer Aniston', 'https://upload.wikimedia.org/wikipedia/commons/1/16/JenniferAnistonHWoFFeb2012.jpg', 'Angela George', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:JenniferAnistonHWoFFeb2012.jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Jennifer Aniston');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Taylor Swift', 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Swift%2C_Taylor_%282007%29_cropped_2.JPG', 'minds-eye', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Swift,_Taylor_(2007)_cropped_2.JPG'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Taylor Swift');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Kim Kardashian', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Kim_Kardashian_%286307608171%29.jpg', 'Eva Rinaldi', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Kim_Kardashian_(6307608171).jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Kim Kardashian');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Dua Lipa', 'https://upload.wikimedia.org/wikipedia/commons/3/31/Dua_Lipa_2021_interview.jpg', 'Warner Music New Zealand', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Dua_Lipa_2021_interview.jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Dua Lipa');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Billie Eilish', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Billie_Eilish_at_Pukkelpop_Festival_-_18_AUGUST_2019_%2804%29.jpg/960px-Billie_Eilish_at_Pukkelpop_Festival_-_18_AUGUST_2019_%2804%29.jpg', 'crommelincklars', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Billie_Eilish_at_Pukkelpop_Festival_-_18_AUGUST_2019_(04).jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Billie Eilish');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Helen Mirren', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/MKr24712_Helen_Mirren_%28Golda%2C_Berlinale_2023%29.jpg/960px-MKr24712_Helen_Mirren_%28Golda%2C_Berlinale_2023%29.jpg', 'Martin Kraft', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:MKr24712_Helen_Mirren_(Golda,_Berlinale_2023).jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Helen Mirren');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Jennifer Lopez', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_2.jpg/960px-Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_2.jpg', 'Everwest', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_2.jpg'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Jennifer Lopez');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Lady Gaga', 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Lady_Gaga_Grammys_2017.png', 'Rogue Artists', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Lady_Gaga_Grammys_2017.png'
  from quizzes q
  where slug = 'celebrity-women' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Lady Gaga');

-- hot-takes
insert into quizzes (slug, name) values ('hot-takes', 'Hot takes') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Pineapple on pizza', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Hawaiian_pizza_1.jpg/960px-Hawaiian_pizza_1.jpg', '@joefoodie from USA', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Hawaiian_pizza_1.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Pineapple on pizza');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Socks with sandals', 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Sandals_Worn_wth_White_Ankle_Socks.jpg', 'Oddman47', 'CC0', 'https://commons.wikimedia.org/wiki/File:Sandals_Worn_wth_White_Ankle_Socks.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Socks with sandals');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Milk before cereal', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Corn_flakes_in_a_bowl.jpg/960px-Corn_flakes_in_a_bowl.jpg', 'JIP', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Corn_flakes_in_a_bowl.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Milk before cereal');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Ketchup on pasta', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Spaghetti_Naporitan_002.jpg/960px-Spaghetti_Naporitan_002.jpg', 'Ocdp', 'CC0', 'https://commons.wikimedia.org/wiki/File:Spaghetti_Naporitan_002.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Ketchup on pasta');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Crocs', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Crocs-synthetic-clogs.jpg/960px-Crocs-synthetic-clogs.jpg', 'Skyeyemx', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Crocs-synthetic-clogs.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Crocs');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Reclining your plane seat', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Seats_on_an_airplane.jpg/960px-Seats_on_an_airplane.jpg', 'Douglas P. Perkins', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Seats_on_an_airplane.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Reclining your plane seat');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cold pizza for breakfast', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Chicken_ranch_and_tortellini_pizza.JPG/960px-Chicken_ranch_and_tortellini_pizza.JPG', 'Drummer070 at English Wikipedia', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Chicken_ranch_and_tortellini_pizza.JPG'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cold pizza for breakfast');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Talking during films', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Audience_in_Kino-Palatsi_cinema_in_Helsinki_in_1930.jpg/960px-Audience_in_Kino-Palatsi_cinema_in_Helsinki_in_1930.jpg', 'Daniel Atelier', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Audience_in_Kino-Palatsi_cinema_in_Helsinki_in_1930.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Talking during films');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cats are better than dogs', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Cute_cat_and_dog_1.jpg/960px-Cute_cat_and_dog_1.jpg', 'S. J. Pyrotechnic from Boise, ID, USA', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Cute_cat_and_dog_1.jpg'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cats are better than dogs');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Camping holidays', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Tent_camping_at_Hurricane_River_Campground_%288ab7ecf4-55e8-462b-a159-b0ce7ade5a0d%29.JPG/960px-Tent_camping_at_Hurricane_River_Campground_%288ab7ecf4-55e8-462b-a159-b0ce7ade5a0d%29.JPG', 'NPS', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Tent_camping_at_Hurricane_River_Campground_(8ab7ecf4-55e8-462b-a159-b0ce7ade5a0d).JPG'
  from quizzes q
  where slug = 'hot-takes' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Camping holidays');

commit;

-- More quizzes: two of hot takes, and two of statements to agree (10) or disagree (1) with.
begin;

-- hot-takes-food
insert into quizzes (slug, name) values ('hot-takes-food', 'Hot takes: food & drink') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Well-done steak', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Grilled_steak_served_on_a_plate_with_avocado_and_sauce.jpg/960px-Grilled_steak_served_on_a_plate_with_avocado_and_sauce.jpg', 'Shixart1985', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Grilled_steak_served_on_a_plate_with_avocado_and_sauce.jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Well-done steak');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Mayo on chips', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Plate_of_thick-cut_french_fries_%28frites%29_served_with_a_side_of_dipping_sauces_%28ketchup_and_mayonnaise%29_at_Clyde_Common_in_Portland%2C_Oregon_%28May_2008%29.jpg/960px-Plate_of_thick-cut_french_fries_%28frites%29_served_with_a_side_of_dipping_sauces_%28ketchup_and_mayonnaise%29_at_Clyde_Common_in_Portland%2C_Oregon_%28May_2008%29.jpg', 'Ryan Snyder', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Plate_of_thick-cut_french_fries_(frites)_served_with_a_side_of_dipping_sauces_(ketchup_and_mayonnaise)_at_Clyde_Common_in_Portland,_Oregon_(May_2008).jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Mayo on chips');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Raisins in cookies', 'https://upload.wikimedia.org/wikipedia/commons/d/d6/O_is_for_oatmeal_raisin_cookies.jpg', '_Libby_', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:O_is_for_oatmeal_raisin_cookies.jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Raisins in cookies');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Mint chocolate', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/2020-04-28_06_44_03_Friendly%27s_Mint_Chocolate_Chip_Ice_Cream_in_the_Franklin_Farm_section_of_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg/960px-2020-04-28_06_44_03_Friendly%27s_Mint_Chocolate_Chip_Ice_Cream_in_the_Franklin_Farm_section_of_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg', 'Famartin', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2020-04-28_06_44_03_Friendly%27s_Mint_Chocolate_Chip_Ice_Cream_in_the_Franklin_Farm_section_of_Oak_Hill,_Fairfax_County,_Virginia.jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Mint chocolate');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Instant coffee', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Homemade_Cold_Coffee%28Indian_Style%29-_Kolkata.jpg/960px-Homemade_Cold_Coffee%28Indian_Style%29-_Kolkata.jpg', 'TAPAS KUMAR HALDER', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Homemade_Cold_Coffee(Indian_Style)-_Kolkata.jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Instant coffee');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Avocado toast', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Avocado_toast.jpg/960px-Avocado_toast.jpg', 'Pequeño mar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Avocado_toast.jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Avocado toast');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Gherkins', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Polish_style_pickled_cucumbers_IMGP0413.jpg/960px-Polish_style_pickled_cucumbers_IMGP0413.jpg', 'Nikodem Nijaki', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Polish_style_pickled_cucumbers_IMGP0413.jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Gherkins');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Marshmallows in hot chocolate', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Hot_chocolate_with_marshmallows_%28cropped%29.jpg/960px-Hot_chocolate_with_marshmallows_%28cropped%29.jpg', 'PapiPijuan', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Hot_chocolate_with_marshmallows_(cropped).jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Marshmallows in hot chocolate');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Truffle fries', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Truffle_oil_french_fries_%2833024792848%29.jpg/960px-Truffle_oil_french_fries_%2833024792848%29.jpg', 'Tony Webster from Minneapolis, Minnesota, United States', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Truffle_oil_french_fries_(33024792848).jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Truffle fries');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Rice pudding', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Bowl_Rice_Cake.jpg/960px-Bowl_Rice_Cake.jpg', 'vixyao', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Bowl_Rice_Cake.jpg'
  from quizzes q
  where slug = 'hot-takes-food' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Rice pudding');

-- hot-takes-life
insert into quizzes (slug, name) values ('hot-takes-life', 'Hot takes: everyday life') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Wearing shoes indoors', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Shoes_Posing_-_2811737980.jpg/960px-Shoes_Posing_-_2811737980.jpg', 'quacktaculous', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Shoes_Posing_-_2811737980.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Wearing shoes indoors');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Self-checkouts', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Cashierless_supermarket_self-checkout_%286249298592%29.jpg/960px-Cashierless_supermarket_self-checkout_%286249298592%29.jpg', 'CoCreatr', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Cashierless_supermarket_self-checkout_(6249298592).jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Self-checkouts');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Christmas decorations in November', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Christmas_decorations_at_the_Indooroopilly_Shopping_Centre%2C_Australia%2C_2020%2C_01.jpg/960px-Christmas_decorations_at_the_Indooroopilly_Shopping_Centre%2C_Australia%2C_2020%2C_01.jpg', 'Chris Olszewski', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Christmas_decorations_at_the_Indooroopilly_Shopping_Centre,_Australia,_2020,_01.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Christmas decorations in November');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Working from home', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Home-office-336377.jpg/960px-Home-office-336377.jpg', 'Free-Photos (Pixabay)', 'CC0', 'https://commons.wikimedia.org/wiki/File:Home-office-336377.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Working from home');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Open-plan offices', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/OpenPlanRedBalloon1.jpg/960px-OpenPlanRedBalloon1.jpg', 'VeronicaTherese', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:OpenPlanRedBalloon1.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Open-plan offices');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Changing the clocks', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Old_alarm_clock_on_the_bookshelf_-_50233824038.jpg/960px-Old_alarm_clock_on_the_bookshelf_-_50233824038.jpg', 'Nenad Stojkovic', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Old_alarm_clock_on_the_bookshelf_-_50233824038.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Changing the clocks');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'It''s OK to take food from a friend''s plate', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Diners_at_a_Food_Stall_Inside_a_Market_Hall.jpg/960px-Diners_at_a_Food_Stall_Inside_a_Market_Hall.jpg', 'RizaCPH', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Diners_at_a_Food_Stall_Inside_a_Market_Hall.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'It''s OK to take food from a friend''s plate');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'The gym at 6am', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Young_blonde_woman_running_on_a_treadmill_in_the_gym_closeup.jpg/960px-Young_blonde_woman_running_on_a_treadmill_in_the_gym_closeup.jpg', 'Shixart1985', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Young_blonde_woman_running_on_a_treadmill_in_the_gym_closeup.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'The gym at 6am');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Electric scooters', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Electric_scooter_Blinkee_rented_for_minutes_in_Tomasz%C3%B3w_Mazowiecki._St._Antoni_and_Bartosz_G%C5%82owacki_Street_corner._September_2021.jpg/960px-Electric_scooter_Blinkee_rented_for_minutes_in_Tomasz%C3%B3w_Mazowiecki._St._Antoni_and_Bartosz_G%C5%82owacki_Street_corner._September_2021.jpg', 'WrS.tm.pl', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Electric_scooter_Blinkee_rented_for_minutes_in_Tomasz%C3%B3w_Mazowiecki._St._Antoni_and_Bartosz_G%C5%82owacki_Street_corner._September_2021.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Electric scooters');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cruise holidays', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Borealis_%28ship%2C_1997%29_at_Liverpool_Cruise_Terminal_2.jpg/960px-Borealis_%28ship%2C_1997%29_at_Liverpool_Cruise_Terminal_2.jpg', 'Rodhullandemu', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Borealis_(ship,_1997)_at_Liverpool_Cruise_Terminal_2.jpg'
  from quizzes q
  where slug = 'hot-takes-life' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cruise holidays');

-- settle-this
insert into quizzes (slug, name) values ('settle-this', 'Settle this') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A hot dog is a sandwich', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Hot_dog_with_mustard.png/960px-Hot_dog_with_mustard.png', 'Czar, original photographed by Renee Comet', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Hot_dog_with_mustard.png'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A hot dog is a sandwich');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cereal is a soup', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Froot-Loops-Cereal-Bowl.jpg/960px-Froot-Loops-Cereal-Bowl.jpg', 'Evan-Amos', 'CC0', 'https://commons.wikimedia.org/wiki/File:Froot-Loops-Cereal-Bowl.jpg'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cereal is a soup');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A tomato is a vegetable', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/960px-Tomato_je.jpg', 'Softeis', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Tomato_je.jpg'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A tomato is a vegetable');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Jaffa Cakes are biscuits', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Jaffa_cakes_in_lightbox_01_%28cropped%29.png/960px-Jaffa_cakes_in_lightbox_01_%28cropped%29.png', 'Richard Cocks', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Jaffa_cakes_in_lightbox_01_(cropped).png'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Jaffa Cakes are biscuits');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A Pop-Tart is a ravioli', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Pop-Tarts-Cherry.jpg/960px-Pop-Tarts-Cherry.jpg', 'Evan-Amos', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Pop-Tarts-Cherry.jpg'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A Pop-Tart is a ravioli');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Water is wet', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Water_drop_001.jpg/960px-Water_drop_001.jpg', 'José Manuel Suárez from Spain', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Water_drop_001.jpg'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Water is wet');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Die Hard is a Christmas film', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Fox_Plaza_%28Los_Angeles%2C_Century_CIty%29_August_2024.JPG/960px-Fox_Plaza_%28Los_Angeles%2C_Century_CIty%29_August_2024.JPG', 'Alexis Doine', 'CC0', 'https://commons.wikimedia.org/wiki/File:Fox_Plaza_(Los_Angeles,_Century_CIty)_August_2024.JPG'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Die Hard is a Christmas film');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Pluto is a planet', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Pluto-01_Stern_03_Pluto_Color_TXT.jpg/960px-Pluto-01_Stern_03_Pluto_Color_TXT.jpg', 'NASA / Johns Hopkins University Applied Physics Laboratory / Southwest Research Institute', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Pluto-01_Stern_03_Pluto_Color_TXT.jpg'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Pluto is a planet');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A straw has one hole', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/A_paper_straw_for_bubble_tea_and_the_popular_straw.jpg/960px-A_paper_straw_for_bubble_tea_and_the_popular_straw.jpg', 'WrS.tm.pl', 'Public domain', 'https://commons.wikimedia.org/wiki/File:A_paper_straw_for_bubble_tea_and_the_popular_straw.jpg'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A straw has one hole');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cheesecake is a pie', 'https://upload.wikimedia.org/wikipedia/commons/d/db/Raised_slice_of_cheesecake.jpg', 'Sirabellas', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Raised_slice_of_cheesecake.jpg'
  from quizzes q
  where slug = 'settle-this' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cheesecake is a pie');

-- who-would-win
insert into quizzes (slug, name) values ('who-would-win', 'Who would win?') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A shark would beat a bear', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Great_White_Shark_%2814730796397%29.jpg/960px-Great_White_Shark_%2814730796397%29.jpg', 'Elias Levy', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Great_White_Shark_(14730796397).jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A shark would beat a bear');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, '100 men would beat a gorilla', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Mountain_gorilla_%28Gorilla_beringei_beringei%29_female_2.jpg/960px-Mountain_gorilla_%28Gorilla_beringei_beringei%29_female_2.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Mountain_gorilla_(Gorilla_beringei_beringei)_female_2.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = '100 men would beat a gorilla');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A lion would beat a tiger', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Bengal_tiger_in_Sanjay_Dubri_Tiger_Reserve_December_2024_by_Tisha_Mukherjee_15.jpg/960px-Bengal_tiger_in_Sanjay_Dubri_Tiger_Reserve_December_2024_by_Tisha_Mukherjee_15.jpg', 'Tisha Mukherjee', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Bengal_tiger_in_Sanjay_Dubri_Tiger_Reserve_December_2024_by_Tisha_Mukherjee_15.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A lion would beat a tiger');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A hippo would beat a crocodile', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Hippo_%28Hippopotamus_amphibius%29_with_open_mouth_%2816587676107%29.jpg/960px-Hippo_%28Hippopotamus_amphibius%29_with_open_mouth_%2816587676107%29.jpg', 'Bernard DUPONT from FRANCE', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Hippo_(Hippopotamus_amphibius)_with_open_mouth_(16587676107).jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A hippo would beat a crocodile');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A horse-sized duck is easier than 100 duck-sized horses', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Male_mallard_duck_2.jpg/960px-Male_mallard_duck_2.jpg', 'Acarpentier', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Male_mallard_duck_2.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A horse-sized duck is easier than 100 duck-sized horses');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A honey badger would beat a cobra', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Prague_ZOO_-_Mellivora_capensis_1.jpg/960px-Prague_ZOO_-_Mellivora_capensis_1.jpg', 'Matěj Baťha', 'CC BY-SA 2.5', 'https://commons.wikimedia.org/wiki/File:Prague_ZOO_-_Mellivora_capensis_1.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A honey badger would beat a cobra');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A kangaroo would beat a boxer', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Parc_australien_-_Kangourou_roux_13.jpg/960px-Parc_australien_-_Kangourou_roux_13.jpg', 'Tylwyth Eldar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Parc_australien_-_Kangourou_roux_13.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A kangaroo would beat a boxer');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'An orca would beat a great white', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Orcinus_orca_-_Loro_Parque_01.jpg/960px-Orcinus_orca_-_Loro_Parque_01.jpg', 'H. Zell', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Orcinus_orca_-_Loro_Parque_01.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'An orca would beat a great white');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A swan could break your arm', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/H%C3%B6ckerschwan_Cygnus_olor_7b_Richard_Bartz.jpg/960px-H%C3%B6ckerschwan_Cygnus_olor_7b_Richard_Bartz.jpg', 'Richard Bartz', 'CC BY-SA 2.5', 'https://commons.wikimedia.org/wiki/File:H%C3%B6ckerschwan_Cygnus_olor_7b_Richard_Bartz.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A swan could break your arm');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'An ostrich would beat a kangaroo', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Struthio_camelus_massaicus%2C_ostriches_running_at_Nairobi_National_Park.jpg/960px-Struthio_camelus_massaicus%2C_ostriches_running_at_Nairobi_National_Park.jpg', 'Jorge Láscar from Australia', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Struthio_camelus_massaicus,_ostriches_running_at_Nairobi_National_Park.jpg'
  from quizzes q
  where slug = 'who-would-win' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'An ostrich would beat a kangaroo');

commit;

-- Disney movies (loosely related photos, no posters on Commons), fruit, trends, and things Gen Z likes.
begin;

-- disney-movies
insert into quizzes (slug, name) values ('disney-movies', 'Disney movies') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'The Little Mermaid', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Robert_Panitzsch_-_K%C3%B8benhavns_havn_med_den_lille_havfrue_-_1938.png/960px-Robert_Panitzsch_-_K%C3%B8benhavns_havn_med_den_lille_havfrue_-_1938.png', 'Robert Panitzsch', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Robert_Panitzsch_-_K%C3%B8benhavns_havn_med_den_lille_havfrue_-_1938.png'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'The Little Mermaid');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Aladdin', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Oil_Lamp_in_the_Form_of_a_Monster.jpg/960px-Oil_Lamp_in_the_Form_of_a_Monster.jpg', 'North Italian 16th Century', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Oil_Lamp_in_the_Form_of_a_Monster.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Aladdin');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Moana', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Outrigger_canoe_in_Kenya.jpg/960px-Outrigger_canoe_in_Kenya.jpg', 'Giorgio Montersino', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Outrigger_canoe_in_Kenya.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Moana');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Beauty and the Beast', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Red_rose_with_black_background.jpg/960px-Red_rose_with_black_background.jpg', 'Laitche', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Red_rose_with_black_background.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Beauty and the Beast');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Finding Nemo', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Amphiprion_ocellaris_%28Clown_anemonefish%29_by_Nick_Hobgood.jpg/960px-Amphiprion_ocellaris_%28Clown_anemonefish%29_by_Nick_Hobgood.jpg', 'Nick Hobgood', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Amphiprion_ocellaris_(Clown_anemonefish)_by_Nick_Hobgood.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Finding Nemo');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Ratatouille', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Brown_rat_%28Rattus_norvegicus%29_Drenthe_2.jpg/960px-Brown_rat_%28Rattus_norvegicus%29_Drenthe_2.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Brown_rat_(Rattus_norvegicus)_Drenthe_2.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Ratatouille');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Up', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Hotair_balloons_amk.jpg/960px-Hotair_balloons_amk.jpg', 'AngMoKio', 'CC BY-SA 2.5', 'https://commons.wikimedia.org/wiki/File:Hotair_balloons_amk.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Up');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Coco', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Ofrenda_en_la_Feria_de_Tlaxcala_2025.jpg/960px-Ofrenda_en_la_Feria_de_Tlaxcala_2025.jpg', 'Isaacvp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Ofrenda_en_la_Feria_de_Tlaxcala_2025.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Coco');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Tangled', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Pingxi_Sky_Lantern_Festival_2014_in_Taiwan_-_12431713344.jpg/960px-Pingxi_Sky_Lantern_Festival_2014_in_Taiwan_-_12431713344.jpg', 'Jirka Matousek', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Pingxi_Sky_Lantern_Festival_2014_in_Taiwan_-_12431713344.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Tangled');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Mulan', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/20090529_Great_Wall_8185.jpg/960px-20090529_Great_Wall_8185.jpg', 'Jakub Hałun', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:20090529_Great_Wall_8185.jpg'
  from quizzes q
  where slug = 'disney-movies' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Mulan');

-- fruit
insert into quizzes (slug, name) values ('fruit', 'Fruit') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Banana', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Bananas_on_black_background_02.jpg/960px-Bananas_on_black_background_02.jpg', 'Krzysztof Golik', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Bananas_on_black_background_02.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Banana');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Mango', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Mangos_-_single_and_halved.jpg/960px-Mangos_-_single_and_halved.jpg', 'Ivar Leidus', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Mangos_-_single_and_halved.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Mango');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Kiwi', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Kiwifruit_halved.jpg/960px-Kiwifruit_halved.jpg', 'Tiia Monto', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Kiwifruit_halved.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Kiwi');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Grapefruit', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Citrus_paradisi_%28Grapefruit%2C_pink%29_white_bg.jpg/960px-Citrus_paradisi_%28Grapefruit%2C_pink%29_white_bg.jpg', 'א (Aleph)', 'CC BY-SA 2.5', 'https://commons.wikimedia.org/wiki/File:Citrus_paradisi_(Grapefruit,_pink)_white_bg.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Grapefruit');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Pomegranate', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/An_opened_pomegranate.JPG/960px-An_opened_pomegranate.JPG', 'Anton Croos', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:An_opened_pomegranate.JPG'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Pomegranate');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Papaya', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Papaya_-_longitudinal_section.jpg/960px-Papaya_-_longitudinal_section.jpg', 'Ivar Leidus', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Papaya_-_longitudinal_section.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Papaya');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Lychee', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Lychee_fruits_and_seed.jpg/960px-Lychee_fruits_and_seed.jpg', 'Ivar Leidus', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Lychee_fruits_and_seed.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Lychee');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Watermelon', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Sliced_Watermelon.jpg/960px-Sliced_Watermelon.jpg', 'Harsha K R', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Sliced_Watermelon.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Watermelon');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Figs', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Fig_%28Ficus_carica%29_fruits.jpg/960px-Fig_%28Ficus_carica%29_fruits.jpg', 'Ivar Leidus', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Fig_(Ficus_carica)_fruits.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Figs');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Blueberries', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Aberdeenshire_blueberries.jpg/960px-Aberdeenshire_blueberries.jpg', 'Mx. Granger', 'CC0', 'https://commons.wikimedia.org/wiki/File:Aberdeenshire_blueberries.jpg'
  from quizzes q
  where slug = 'fruit' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Blueberries');

-- trends
insert into quizzes (slug, name) values ('trends', 'Trends') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Moustaches', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/The_Handlebar_%28Moustache%29_Club_-_LONDON_-_07-03-2013.jpg/960px-The_Handlebar_%28Moustache%29_Club_-_LONDON_-_07-03-2013.jpg', 'Eduardo Gaviña from Bilbao, PAIS VASCO', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:The_Handlebar_(Moustache)_Club_-_LONDON_-_07-03-2013.jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Moustaches');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Skinny jeans', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Skinny_jeans_street_style_%C3%A0_Strasbourg_octobre_2013.jpg/960px-Skinny_jeans_street_style_%C3%A0_Strasbourg_octobre_2013.jpg', 'Claude TRUONG-NGOC', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Skinny_jeans_street_style_%C3%A0_Strasbourg_octobre_2013.jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Skinny jeans');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Man buns', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Man_bun_%28Unsplash%29.jpg/960px-Man_bun_%28Unsplash%29.jpg', 'Joshua Munoz', 'CC0', 'https://commons.wikimedia.org/wiki/File:Man_bun_(Unsplash).jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Man buns');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Crop tops', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Crop_top_-_stomach_%281%29.jpg/960px-Crop_top_-_stomach_%281%29.jpg', 'Jorge Mir', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Crop_top_-_stomach_(1).jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Crop tops');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Bucket hats', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Black_Barbour_bucket_hat.jpg/960px-Black_Barbour_bucket_hat.jpg', 'W.carter', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Black_Barbour_bucket_hat.jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Bucket hats');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Mullets', 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Man_with_Mullet_2022.jpg', 'Mathimed', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Man_with_Mullet_2022.jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Mullets');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Bum bags', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Leather_Fanny_Pack.JPG/960px-Leather_Fanny_Pack.JPG', 'Plot Spoiler', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Leather_Fanny_Pack.JPG'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Bum bags');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Tie-dye', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Tie_dye_spiral.jpg/960px-Tie_dye_spiral.jpg', 'Desmont4joy', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Tie_dye_spiral.jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Tie-dye');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Vinyl records', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Kazantip%2C_Popovka%2C_Crimea%2C_Technics_turntable%2C_Vinyl_turntable.jpg/960px-Kazantip%2C_Popovka%2C_Crimea%2C_Technics_turntable%2C_Vinyl_turntable.jpg', 'Vyacheslav Argenberg', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Kazantip,_Popovka,_Crimea,_Technics_turntable,_Vinyl_turntable.jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Vinyl records');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Fidget spinners', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Fidget_spinner_red%2C_cropped.jpg/960px-Fidget_spinner_red%2C_cropped.jpg', 'Árni Dagur', 'CC0', 'https://commons.wikimedia.org/wiki/File:Fidget_spinner_red,_cropped.jpg'
  from quizzes q
  where slug = 'trends' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Fidget spinners');

-- gen-z
insert into quizzes (slug, name) values ('gen-z', 'Things Gen Z likes') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Bubble tea', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/2009-12-30_cups_of_bubble_tea_at_a_Chunshuitang_in_Taipei.jpg/960px-2009-12-30_cups_of_bubble_tea_at_a_Chunshuitang_in_Taipei.jpg', 'takuma mori', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:2009-12-30_cups_of_bubble_tea_at_a_Chunshuitang_in_Taipei.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Bubble tea');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Thrifting', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Working_in_charity_shop.jpg/960px-Working_in_charity_shop.jpg', 'Opaquetights99', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Working_in_charity_shop.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Thrifting');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Matcha', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Matcha_tea_latte_with_rosetta_latte_art.jpg/960px-Matcha_tea_latte_with_rosetta_latte_art.jpg', 'Irvan Ary Maulana', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Matcha_tea_latte_with_rosetta_latte_art.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Matcha');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Film cameras', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/NEXT18_%2843012666910%29.jpg/960px-NEXT18_%2843012666910%29.jpg', 'NEXT Conference from Berlin, Deutschland', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:NEXT18_(43012666910).jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Film cameras');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Baggy jeans', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Baggy_Pants_and_Curls_%2823743286741%29.jpg/960px-Baggy_Pants_and_Curls_%2823743286741%29.jpg', 'Michael Coghlan from Adelaide, Australia', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Baggy_Pants_and_Curls_(23743286741).jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Baggy jeans');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Stanley cups', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanley_bottles_tumblers_Vacuum_flasks_company_26_January_2025_Philippines1.jpg/960px-Stanley_bottles_tumblers_Vacuum_flasks_company_26_January_2025_Philippines1.jpg', null, 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Stanley_bottles_tumblers_Vacuum_flasks_company_26_January_2025_Philippines1.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Stanley cups');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'K-pop', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/IVE_%28%EC%95%84%EC%9D%B4%EB%B8%8C%29_performing_at_the_2023_World_Scout_Jamboree_K-POP_Super_Live_Concert.jpg/960px-IVE_%28%EC%95%84%EC%9D%B4%EB%B8%8C%29_performing_at_the_2023_World_Scout_Jamboree_K-POP_Super_Live_Concert.jpg', 'Korea.net / Korean Culture and Information Service', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:IVE_(%EC%95%84%EC%9D%B4%EB%B8%8C)_performing_at_the_2023_World_Scout_Jamboree_K-POP_Super_Live_Concert.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'K-pop');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Anime', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Ikebukuro_cosplay_convention_crashing_-_54315817995.jpg/960px-Ikebukuro_cosplay_convention_crashing_-_54315817995.jpg', 'sergejf', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Ikebukuro_cosplay_convention_crashing_-_54315817995.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Anime');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Labubu', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Labubu_Pop_Mart_store_in_New_York_City.jpg/960px-Labubu_Pop_Mart_store_in_New_York_City.jpg', 'Thelabubucollector', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Labubu_Pop_Mart_store_in_New_York_City.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Labubu');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Energy drinks', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Various_energy_drinks_04.jpg/960px-Various_energy_drinks_04.jpg', 'Oto Zapletal', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Various_energy_drinks_04.jpg'
  from quizzes q
  where slug = 'gen-z' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Energy drinks');

commit;

-- Statements people argue about, from Reddit's controversial-opinion threads. 10 = agree, 1 = disagree.
begin;

-- unpopular-opinions
insert into quizzes (slug, name) values ('unpopular-opinions', 'Unpopular opinions') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A beach holiday is a waste of time', 'https://upload.wikimedia.org/wikipedia/commons/3/39/Crowded_Brighton_beach_east_of_Palace_Pier_-_geograph.org.uk_-_1338809.jpg', 'David Hawgood', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Crowded_Brighton_beach_east_of_Palace_Pier_-_geograph.org.uk_-_1338809.jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A beach holiday is a waste of time');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'You''re not vegetarian if you eat fish', 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Plated_grilled_fish_%28cropped%29.jpg', 'pompi', 'CC0', 'https://commons.wikimedia.org/wiki/File:Plated_grilled_fish_(cropped).jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'You''re not vegetarian if you eat fish');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Coriander tastes like soap', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/A_scene_of_Coriander_leaves.JPG/960px-A_scene_of_Coriander_leaves.JPG', 'Thamizhpparithi Maari', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:A_scene_of_Coriander_leaves.JPG'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Coriander tastes like soap');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Charcuterie boards are a scam', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Traditional_Charcuterie_Board.png/960px-Traditional_Charcuterie_Board.png', 'TammyBellBells', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Traditional_Charcuterie_Board.png'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Charcuterie boards are a scam');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Starbucks isn''t worth the money', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Starbucks_Coffee_%2829871391053%29.jpg/960px-Starbucks_Coffee_%2829871391053%29.jpg', 'GoToVan from Vancouver, Canada', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Starbucks_Coffee_(29871391053).jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Starbucks isn''t worth the money');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Runny egg yolks are gross', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Fried_egg_cooking_in_a_pan.jpg/960px-Fried_egg_cooking_in_a_pan.jpg', 'Horacio Cambeiro', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Fried_egg_cooking_in_a_pan.jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Runny egg yolks are gross');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Nuts ruin brownies', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Fresh_Baked_Brownies_%28Unsplash%29.jpg/960px-Fresh_Baked_Brownies_%28Unsplash%29.jpg', 'Jade Wulfraat', 'CC0', 'https://commons.wikimedia.org/wiki/File:Fresh_Baked_Brownies_(Unsplash).jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Nuts ruin brownies');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cold leftovers beat reheated', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Food_Safety_-_Cut_Waste_in_Refrigerators_%2820200608-FSIS-LSC-0093%29.jpg/960px-Food_Safety_-_Cut_Waste_in_Refrigerators_%2820200608-FSIS-LSC-0093%29.jpg', 'USDAgov', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Food_Safety_-_Cut_Waste_in_Refrigerators_(20200608-FSIS-LSC-0093).jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cold leftovers beat reheated');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Avocado has no taste', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Avocado_-_single_and_halved.jpg/960px-Avocado_-_single_and_halved.jpg', 'Splintercell10', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Avocado_-_single_and_halved.jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Avocado has no taste');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cereal is a dessert', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Bowl_of_Cereal_%28Unsplash%29.jpg/960px-Bowl_of_Cereal_%28Unsplash%29.jpg', 'Yvens Banatte', 'CC0', 'https://commons.wikimedia.org/wiki/File:Bowl_of_Cereal_(Unsplash).jpg'
  from quizzes q
  where slug = 'unpopular-opinions' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cereal is a dessert');

-- etiquette-wars
insert into quizzes (slug, name) values ('etiquette-wars', 'Etiquette wars') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Child-free weddings are fine', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Group._At_Moishe%27s_BAnQ_P48S1P13644.jpg', 'Conrad Poirier', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Group._At_Moishe%27s_BAnQ_P48S1P13644.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Child-free weddings are fine');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Split the bill evenly, even if you only had a salad', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/HK_SKD_TKO_%E5%B0%87%E8%BB%8D%E6%BE%B3_Tseung_Kwan_O_%E5%9D%91%E5%8F%A3_Hang_Hau_%E6%9D%B1%E6%B8%AF%E5%9F%8E_East_Point_City_mall_shop_%E4%B8%8A%E6%B5%B7_%E8%AC%9D%E8%AC%9D%E5%84%82%E9%A4%90%E5%BB%B3_Shanghai_Xie_Xie_Nogn_Restaurant_bill_receipt_July_2021_SS2.jpg/960px-thumbnail.jpg', 'Hiqwm Wreop Uis', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:HK_SKD_TKO_%E5%B0%87%E8%BB%8D%E6%BE%B3_Tseung_Kwan_O_%E5%9D%91%E5%8F%A3_Hang_Hau_%E6%9D%B1%E6%B8%AF%E5%9F%8E_East_Point_City_mall_shop_%E4%B8%8A%E6%B5%B7_%E8%AC%9D%E8%AC%9D%E5%84%82%E9%A4%90%E5%BB%B3_Shanghai_Xie_Xie_Nogn_Restaurant_bill_receipt_July_2021_SS2.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Split the bill evenly, even if you only had a salad');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Dogs belong in pubs and restaurants', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Dog_resting_peacefully_closeup.jpg/960px-Dog_resting_peacefully_closeup.jpg', 'Shixart1985', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Dog_resting_peacefully_closeup.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Dogs belong in pubs and restaurants');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Phones on the dinner table are rude', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Burritos_Grill_Eastern_New_Orleans_Sept_2017_5.jpg/960px-Burritos_Grill_Eastern_New_Orleans_Sept_2017_5.jpg', 'Infrogmation of New Orleans', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Burritos_Grill_Eastern_New_Orleans_Sept_2017_5.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Phones on the dinner table are rude');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Ghosting after one date is fine', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Woman_looking_at_phone_in_a_casual_setting_while_smiling_and_enjoying_the_moment_with_a_relaxed_atmosphere.jpg/960px-Woman_looking_at_phone_in_a_casual_setting_while_smiling_and_enjoying_the_moment_with_a_relaxed_atmosphere.jpg', 'Shixart1985', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Woman_looking_at_phone_in_a_casual_setting_while_smiling_and_enjoying_the_moment_with_a_relaxed_atmosphere.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Ghosting after one date is fine');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Kids don''t belong in fancy restaurants', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/2022_Maastricht%2C_Ch%C3%A2teau_Neercanne_%2807%29.jpg/960px-2022_Maastricht%2C_Ch%C3%A2teau_Neercanne_%2807%29.jpg', 'Kleon3', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2022_Maastricht,_Ch%C3%A2teau_Neercanne_(07).jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Kids don''t belong in fancy restaurants');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Tipping should be scrapped', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Student%27s_tip_jar.jpg/960px-Student%27s_tip_jar.jpg', 'tadhanna (Pixabay)', 'CC0', 'https://commons.wikimedia.org/wiki/File:Student%27s_tip_jar.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Tipping should be scrapped');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, '''No gifts'' means no gifts', 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Decorative_cake_in_shape_of_a_present%2C_with_large_orange_bow.jpg', 'Steven Depolo', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Decorative_cake_in_shape_of_a_present,_with_large_orange_bow.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = '''No gifts'' means no gifts');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Voice notes are rude', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Smartphone_Use.jpg/960px-Smartphone_Use.jpg', 'Océanos y dados', 'CC0', 'https://commons.wikimedia.org/wiki/File:Smartphone_Use.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Voice notes are rude');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Ten minutes late is on time', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Quartz_wristwatch_Mondaine_Classic_Pure_A660.30314.16OM.jpg/960px-Quartz_wristwatch_Mondaine_Classic_Pure_A660.30314.16OM.jpg', 'Alex P. Kok', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Quartz_wristwatch_Mondaine_Classic_Pure_A660.30314.16OM.jpg'
  from quizzes q
  where slug = 'etiquette-wars' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Ten minutes late is on time');

-- the-ick (10 = big ick)
insert into quizzes (slug, name) values ('the-ick', 'The ick') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Calling your mum every day', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Woman_talks_on_phone_while_sitting_at_a_table_in_an_outdoor_cafe_during_the_day.jpg/960px-Woman_talks_on_phone_while_sitting_at_a_table_in_an_outdoor_cafe_during_the_day.jpg', 'Shixart1985', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Woman_talks_on_phone_while_sitting_at_a_table_in_an_outdoor_cafe_during_the_day.jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Calling your mum every day');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Splitting the bill to the penny', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Pile_of_Pennies_4_%2825257777124%29.jpg/960px-Pile_of_Pennies_4_%2825257777124%29.jpg', 'cweyant from Syracuse, United States', 'CC0', 'https://commons.wikimedia.org/wiki/File:Pile_of_Pennies_4_(25257777124).jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Splitting the bill to the penny');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Talking about crypto', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Bitcoin_BTC_golden_coin_with_the_symbol.jpg/960px-Bitcoin_BTC_golden_coin_with_the_symbol.jpg', 'Satheesh Sankaran', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Bitcoin_BTC_golden_coin_with_the_symbol.jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Talking about crypto');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Clapping when the plane lands', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Airplane_landing_at_zurich_airport.jpg/960px-Airplane_landing_at_zurich_airport.jpg', 'Kuhnmi', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Airplane_landing_at_zurich_airport.jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Clapping when the plane lands');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Baby voice', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Couple_in_Seafront_Restaurant_-_16_x_9_Photo_-_Kep_-_Cambodia_%2848543450402%29.jpg/960px-Couple_in_Seafront_Restaurant_-_16_x_9_Photo_-_Kep_-_Cambodia_%2848543450402%29.jpg', 'Adam Jones from Kelowna, BC, Canada', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Couple_in_Seafront_Restaurant_-_16_x_9_Photo_-_Kep_-_Cambodia_(48543450402).jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Baby voice');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Fedoras', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Indiana_Jones_fedora_hat.jpg/960px-Indiana_Jones_fedora_hat.jpg', 'Clément Bucco-Lechat', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Indiana_Jones_fedora_hat.jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Fedoras');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Running for the bus', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Arriva_London_bus_HV81_%28LJ62_BJX%29_at_Lynmouth_Road_stop%2C_Stamford_Hill%2C_27_April_2013.jpg/960px-Arriva_London_bus_HV81_%28LJ62_BJX%29_at_Lynmouth_Road_stop%2C_Stamford_Hill%2C_27_April_2013.jpg', 'David McKay', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Arriva_London_bus_HV81_(LJ62_BJX)_at_Lynmouth_Road_stop,_Stamford_Hill,_27_April_2013.jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Running for the bus');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Socks in bed', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Socks_-_Komi-Permyak_-_Meshkov_house.jpg/960px-Socks_-_Komi-Permyak_-_Meshkov_house.jpg', 'Лапоть', 'CC0', 'https://commons.wikimedia.org/wiki/File:Socks_-_Komi-Permyak_-_Meshkov_house.jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Socks in bed');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Being rude to waiters', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/The_waiter_works_in_a_restaurant_in_a_medical_mask%2C_gloves_during_coronavirus_pandemic.jpg/960px-The_waiter_works_in_a_restaurant_in_a_medical_mask%2C_gloves_during_coronavirus_pandemic.jpg', 'Vuong Tran', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:The_waiter_works_in_a_restaurant_in_a_medical_mask,_gloves_during_coronavirus_pandemic.jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Being rude to waiters');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Having no books at home', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Moscow%2C_VDNKh%2C_empty_bookshelf_on_an_open-air_deck_%2819187617471%29.jpg/960px-Moscow%2C_VDNKh%2C_empty_bookshelf_on_an_open-air_deck_%2819187617471%29.jpg', 'Gennady Grachev from Moscow, Russia', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Moscow,_VDNKh,_empty_bookshelf_on_an_open-air_deck_(19187617471).jpg'
  from quizzes q
  where slug = 'the-ick' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Having no books at home');

-- overhyped (10 = massively overhyped)
insert into quizzes (slug, name) values ('overhyped', 'Overhyped') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Friends (the TV show)', 'https://upload.wikimedia.org/wikipedia/commons/c/c9/The_Central_Perk_Set_from_Friends_%287823245828%29.jpg', 'Stuart Sevastos', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:The_Central_Perk_Set_from_Friends_(7823245828).jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Friends (the TV show)');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Brunch', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Eggs_Benedict-01-cropped.jpg/960px-Eggs_Benedict-01-cropped.jpg', 'Jon Mountjoy', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Eggs_Benedict-01-cropped.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Brunch');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Seinfeld', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Tom%27s_Restaurant%2C_NYC.jpg/960px-Tom%27s_Restaurant%2C_NYC.jpg', 'Rick Dikeman', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Tom%27s_Restaurant,_NYC.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Seinfeld');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Bacon', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Irish_breakfast%2C_cooked.JPG/960px-Irish_breakfast%2C_cooked.JPG', 'O''Dea', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Irish_breakfast,_cooked.JPG'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Bacon');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Truffle anything', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Truffe02.jpg/960px-Truffe02.jpg', null, 'Public domain', 'https://commons.wikimedia.org/wiki/File:Truffe02.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Truffle anything');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Disneyland', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Sleeping_Beauty_Castle_2019.jpg/960px-Sleeping_Beauty_Castle_2019.jpg', 'CrispyCream27', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Sleeping_Beauty_Castle_2019.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Disneyland');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Cheese', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Quesos-LaRural-00921.jpg/960px-Quesos-LaRural-00921.jpg', 'Ezarate', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Quesos-LaRural-00921.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Cheese');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Oysters', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Oysters_served_on_ice.jpg/960px-Oysters_served_on_ice.jpg', 'sanjay_ach', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Oysters_served_on_ice.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Oysters');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'The Beatles', 'https://upload.wikimedia.org/wikipedia/commons/5/56/The_Beatles_Abbey_Road_zebra_crossing_-_geograph.org.uk_-_3134962.jpg', 'Thomas Nugent', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:The_Beatles_Abbey_Road_zebra_crossing_-_geograph.org.uk_-_3134962.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'The Beatles');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Christmas', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Christmas_tree_lights_photographed_with_moving_camera.jpg/960px-Christmas_tree_lights_photographed_with_moving_camera.jpg', 'Annatsach', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Christmas_tree_lights_photographed_with_moving_camera.jpg'
  from quizzes q
  where slug = 'overhyped' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Christmas');

commit;

-- Mildly infuriating: 10 = absolutely fuming, 1 = doesn't bother me.
begin;

insert into quizzes (slug, name) values ('mildly-infuriating', 'Mildly infuriating') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'People who stop at the top of the escalator', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Copenhagen_Metro_escalators.jpg/960px-Copenhagen_Metro_escalators.jpg', 'Stig Nygaard from Copenhagen, Denmark', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Copenhagen_Metro_escalators.jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'People who stop at the top of the escalator');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Unexpected item in the bagging area', 'https://upload.wikimedia.org/wikipedia/commons/9/95/Self_Checkout_UK_2008.jpg', 'pin add', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Self_Checkout_UK_2008.jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Unexpected item in the bagging area');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'A USB plug that never goes in first time', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/USB_A_Connector_Dual_Side.JPG/960px-USB_A_Connector_Dual_Side.JPG', 'wdwd', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:USB_A_Connector_Dual_Side.JPG'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'A USB plug that never goes in first time');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Slow walkers taking up the whole pavement', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Crowded_Downtown_Sidewalk_%282804409846%29.jpg/960px-Crowded_Downtown_Sidewalk_%282804409846%29.jpg', 'IowaPolitics.com', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Crowded_Downtown_Sidewalk_(2804409846).jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Slow walkers taking up the whole pavement');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Stickers that won''t peel off cleanly', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Fruit_label_used_on_a_honeydew_melon.jpg/960px-Fruit_label_used_on_a_honeydew_melon.jpg', 'Downtowngal', 'CC0', 'https://commons.wikimedia.org/wiki/File:Fruit_label_used_on_a_honeydew_melon.jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Stickers that won''t peel off cleanly');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Stepping in water in your socks', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Z%C3%BCrich_%28Schweiz%29_--_2011_--_1396.jpg/960px-Z%C3%BCrich_%28Schweiz%29_--_2011_--_1396.jpg', 'Dietmar Rabich', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Z%C3%BCrich_(Schweiz)_--_2011_--_1396.jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Stepping in water in your socks');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Your phone dying at 1%', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/XiaomiMiNote2charging20210904183242.jpg/960px-XiaomiMiNote2charging20210904183242.jpg', 'OnionBulb', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:XiaomiMiNote2charging20210904183242.jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Your phone dying at 1%');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Crisp packets that are half air', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/2020-09-29_21_13_53_A_bag_of_Utz_Ripples_Original_Potato_Chips_in_the_Dulles_section_of_Sterling%2C_Loudoun_County%2C_Virginia.jpg/960px-2020-09-29_21_13_53_A_bag_of_Utz_Ripples_Original_Potato_Chips_in_the_Dulles_section_of_Sterling%2C_Loudoun_County%2C_Virginia.jpg', 'Famartin', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2020-09-29_21_13_53_A_bag_of_Utz_Ripples_Original_Potato_Chips_in_the_Dulles_section_of_Sterling,_Loudoun_County,_Virginia.jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Crisp packets that are half air');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'No thank you when you hold the door', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/The_Bay_Queen_Street_revolving_door_entrance_%2849975840732%29.jpg/960px-The_Bay_Queen_Street_revolving_door_entrance_%2849975840732%29.jpg', 'Ben Schumin from Montgomery Village, Maryland, USA', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:The_Bay_Queen_Street_revolving_door_entrance_(49975840732).jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'No thank you when you hold the door');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Tangled headphones', 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Tangled_cables_on_Modular_synthesizer_-_Tokyo_Festival_of_Modular_2014_-_Day_1_%282014-06-07%29.jpg', 'Kazuhisa OTSUBO from Tokyo, Japan', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Tangled_cables_on_Modular_synthesizer_-_Tokyo_Festival_of_Modular_2014_-_Day_1_(2014-06-07).jpg'
  from quizzes q
  where slug = 'mildly-infuriating' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Tangled headphones');

commit;

-- Annoying habits: things people do that drive others up the wall. 10 = very annoying.
begin;

insert into quizzes (slug, name) values ('annoying-habits', 'Annoying habits') on conflict (slug) do nothing;
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Chewing with your mouth open', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Man_eating_bacon_roll_Sclater_Street_Yard_Brick_Lane_Market_Tower_Hamlets_London_England.jpg/960px-Man_eating_bacon_roll_Sclater_Street_Yard_Brick_Lane_Market_Tower_Hamlets_London_England.jpg', 'Acabashi', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Man_eating_bacon_roll_Sclater_Street_Yard_Brick_Lane_Market_Tower_Hamlets_London_England.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Chewing with your mouth open');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Phone calls on speaker in public', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Wyr%C4%99ba%2C_Poland_%28Unsplash%29.jpg/960px-Wyr%C4%99ba%2C_Poland_%28Unsplash%29.jpg', 'freestocks.org', 'CC0', 'https://commons.wikimedia.org/wiki/File:Wyr%C4%99ba,_Poland_(Unsplash).jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Phone calls on speaker in public');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Reply-all emails', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Mailpile-inbox.png/960px-Mailpile-inbox.png', 'BrennanNovak', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Mailpile-inbox.png'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Reply-all emails');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Leaving one sheet on the toilet roll', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Toilet_paper_orientation_over.jpg/960px-Toilet_paper_orientation_over.jpg', 'Elya', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Toilet_paper_orientation_over.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Leaving one sheet on the toilet roll');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Clipping nails in public', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/2023_Obcinacze_do_paznokci.jpg/960px-2023_Obcinacze_do_paznokci.jpg', 'Jacek Halicki', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2023_Obcinacze_do_paznokci.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Clipping nails in public');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Kicking the back of your seat', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/HK_%E5%95%9F%E5%BE%B7%E5%95%86%E5%A0%B4_AirSide_Kai_Tak_Mall_%E9%9B%BB%E5%BD%B1%E9%99%A2_MCL_Cinemas_room_interior_row_seats_January_2024_R12S_03.jpg/960px-HK_%E5%95%9F%E5%BE%B7%E5%95%86%E5%A0%B4_AirSide_Kai_Tak_Mall_%E9%9B%BB%E5%BD%B1%E9%99%A2_MCL_Cinemas_room_interior_row_seats_January_2024_R12S_03.jpg', 'Ah Bo Bo Maisy 2024', 'CC0', 'https://commons.wikimedia.org/wiki/File:HK_%E5%95%9F%E5%BE%B7%E5%95%86%E5%A0%B4_AirSide_Kai_Tak_Mall_%E9%9B%BB%E5%BD%B1%E9%99%A2_MCL_Cinemas_room_interior_row_seats_January_2024_R12S_03.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Kicking the back of your seat');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Not using indicators', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/M%C3%BCnster%2C_Beresa%2C_Mercedes-Benz_C-Klasse_Cabrio_--_2018_--_1757.jpg/960px-M%C3%BCnster%2C_Beresa%2C_Mercedes-Benz_C-Klasse_Cabrio_--_2018_--_1757.jpg', 'Dietmar Rabich', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:M%C3%BCnster,_Beresa,_Mercedes-Benz_C-Klasse_Cabrio_--_2018_--_1757.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Not using indicators');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Leaving dishes ''to soak''', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Dirty_dishes_in_the_sink.jpg/960px-Dirty_dishes_in_the_sink.jpg', 'Shixart1985', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Dirty_dishes_in_the_sink.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Leaving dishes ''to soak''');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Sniffing instead of blowing your nose', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/A_tissue_box.jpg/960px-A_tissue_box.jpg', 'Captain MarcusL', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:A_tissue_box.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Sniffing instead of blowing your nose');
insert into items (quiz_id, name, image_url, image_author, image_licence, image_source_url)
  select id, 'Spoiling the ending of a show', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Woman_sitting_on_a_couch_watching_television_while_covered_with_a_blanket.jpg/960px-Woman_sitting_on_a_couch_watching_television_while_covered_with_a_blanket.jpg', 'Shixart1985', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Woman_sitting_on_a_couch_watching_television_while_covered_with_a_blanket.jpg'
  from quizzes q
  where slug = 'annoying-habits' and not exists (select 1 from items i where i.quiz_id = q.id and i.name = 'Spoiling the ending of a show');

commit;
