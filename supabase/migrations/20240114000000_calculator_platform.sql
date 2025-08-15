-- Enable RLS (Row Level Security)
alter database postgres set row_security = on;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create calculators table
create table if not exists public.calculators (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  prompt text not null,
  spec jsonb not null,
  is_public boolean default false,
  is_template boolean default false,
  category text,
  tags text[],
  views_count integer default 0,
  likes_count integer default 0,
  forks_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create calculator_likes table
create table if not exists public.calculator_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  calculator_id uuid references public.calculators(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, calculator_id)
);

-- Create calculator_forks table
create table if not exists public.calculator_forks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  original_calculator_id uuid references public.calculators(id) on delete cascade not null,
  forked_calculator_id uuid references public.calculators(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, original_calculator_id, forked_calculator_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.calculators enable row level security;
alter table public.calculator_likes enable row level security;
alter table public.calculator_forks enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Calculators policies
create policy "Public calculators are viewable by everyone"
  on public.calculators for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users can insert their own calculators"
  on public.calculators for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calculators"
  on public.calculators for update
  using (auth.uid() = user_id);

create policy "Users can delete their own calculators"
  on public.calculators for delete
  using (auth.uid() = user_id);

-- Calculator likes policies
create policy "Likes are viewable by everyone"
  on public.calculator_likes for select
  using (true);

create policy "Users can insert their own likes"
  on public.calculator_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on public.calculator_likes for delete
  using (auth.uid() = user_id);

-- Calculator forks policies
create policy "Forks are viewable by everyone"
  on public.calculator_forks for select
  using (true);

create policy "Users can insert their own forks"
  on public.calculator_forks for insert
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists calculators_user_id_idx on public.calculators(user_id);
create index if not exists calculators_is_public_idx on public.calculators(is_public);
create index if not exists calculators_is_template_idx on public.calculators(is_template);
create index if not exists calculators_category_idx on public.calculators(category);
create index if not exists calculators_created_at_idx on public.calculators(created_at);
create index if not exists calculator_likes_calculator_id_idx on public.calculator_likes(calculator_id);
create index if not exists calculator_forks_original_calculator_id_idx on public.calculator_forks(original_calculator_id);

-- Function to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update likes count
create or replace function public.update_calculator_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.calculators
    set likes_count = likes_count + 1,
        updated_at = timezone('utc'::text, now())
    where id = NEW.calculator_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.calculators
    set likes_count = likes_count - 1,
        updated_at = timezone('utc'::text, now())
    where id = OLD.calculator_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger to update likes count
create trigger calculator_likes_count_trigger
  after insert or delete on public.calculator_likes
  for each row execute procedure public.update_calculator_likes_count();

-- Function to update forks count
create or replace function public.update_calculator_forks_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.calculators
    set forks_count = forks_count + 1,
        updated_at = timezone('utc'::text, now())
    where id = NEW.original_calculator_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.calculators
    set forks_count = forks_count - 1,
        updated_at = timezone('utc'::text, now())
    where id = OLD.original_calculator_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger to update forks count
create trigger calculator_forks_count_trigger
  after insert or delete on public.calculator_forks
  for each row execute procedure public.update_calculator_forks_count();

-- Function to increment calculator views
create or replace function public.increment_calculator_views(calculator_id uuid)
returns void as $$
begin
  update public.calculators 
  set views_count = views_count + 1,
      updated_at = timezone('utc'::text, now())
  where id = calculator_id;
end;
$$ language plpgsql security definer;
