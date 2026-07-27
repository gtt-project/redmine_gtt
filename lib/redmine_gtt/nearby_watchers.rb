module RedmineGtt
  # Subscribes users who opted in to auto-watch issues near their stored
  # location (#14). Candidates are narrowed in SQL (active users with a
  # location within the hard radius cap, distance computed once on the
  # geography type); the per-user radius and the issue visibility are then
  # checked in Ruby, because the radius lives in the serialized user
  # preference and visibility rules are not expressible in a single query.
  module NearbyWatchers

    # Adds every matching user as a watcher of the issue. Meant to run
    # inside the issue's save transaction, before core's
    # after_create_commit notification computes the watcher list, so the
    # subscribed users receive the creation mail like any other watcher.
    def self.subscribe(issue)
      return unless issue.geom.present?

      nearby_users(issue).each { |user| issue.add_watcher(user) }
    end

    def self.nearby_users(issue)
      candidates(issue).select do |user|
        radius_m = user.pref.gtt_watch_nearby? && user.pref.gtt_watch_radius_m
        radius_m &&
          user['gtt_distance_m'].to_f <= radius_m &&
          issue.visible?(user)
      end
    end

    # Active regular users with a stored location within the hard cap.
    # The issue geometry is bound as an EWKB hex parameter; the distance is
    # measured on the geography type (meters, any geometry type).
    def self.candidates(issue)
      max_meters = Patches::UserPreferencePatch::NEARBY_WATCH_MAX_RADIUS_M
      distance = User.send(:sanitize_sql_array, [
        "ST_Distance(#{User.table_name}.geom::geography, ?::geometry::geography)",
        ewkb_hex(issue.geom)
      ])

      User.active.
        where(type: 'User').
        where.not(geom: nil).
        where("#{distance} <= ?", max_meters).
        select("#{User.table_name}.*, #{distance} AS gtt_distance_m").
        preload(:preference)
    end

    def self.ewkb_hex(geom)
      RGeo::WKRep::WKBGenerator.new(
        type_format: :ewkb, emit_ewkb_srid: true, hex_format: true
      ).generate(geom)
    end
    private_class_method :ewkb_hex

  end
end
