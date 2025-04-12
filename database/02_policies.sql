-- Enable Row Level Security for all tables
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_techs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profile FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profile FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profile FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Public projects are viewable by everyone"
    ON projects FOR SELECT
    USING (true);

CREATE POLICY "Users can insert projects to their profile"
    ON projects FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

-- Available techs policies
CREATE POLICY "Technologies are viewable by everyone"
    ON available_techs FOR SELECT
    USING (true);

CREATE POLICY "Users can insert technologies to their profile"
    ON available_techs FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

CREATE POLICY "Users can update their own technologies"
    ON available_techs FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

CREATE POLICY "Users can delete their own technologies"
    ON available_techs FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

-- Visit stats policies
CREATE POLICY "Visit stats are viewable by everyone"
    ON visit_stats FOR SELECT
    USING (true);

CREATE POLICY "Only authenticated users can update visit stats"
    ON visit_stats FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can insert visit stats"
    ON visit_stats FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Page visits policies
CREATE POLICY "Page visits are viewable by profile owners"
    ON page_visits FOR SELECT
    USING (
        auth.uid() IN (
            SELECT p.user_id 
            FROM profile p 
            JOIN projects pr ON p.id = pr.profile_id 
            WHERE pr.id = project_id
        )
    );

CREATE POLICY "Anyone can insert page visits"
    ON page_visits FOR INSERT
    WITH CHECK (true);

-- Contact requests policies
CREATE POLICY "Contact requests are viewable by profile owner"
    ON contact_requests FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

CREATE POLICY "Anyone can submit contact requests"
    ON contact_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Profile owners can update contact request status"
    ON contact_requests FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );

CREATE POLICY "Profile owners can delete contact requests"
    ON contact_requests FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM profile WHERE id = profile_id
        )
    );