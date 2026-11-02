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
