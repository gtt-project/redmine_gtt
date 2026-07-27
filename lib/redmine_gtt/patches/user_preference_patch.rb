module RedmineGtt
  module Patches

    # Stores the "auto watch nearby issues" opt-in (#14) in the serialized
    # UserPreference#others hash, so no schema change is needed. The user's
    # stored location (users.geom) is the center of the watch area; the
    # radius is kept in kilometers as entered on the My account page.
    #
    # This patch only adds the preference storage and validated readers.
    # The watcher assignment itself hooks into issue creation separately.
    module UserPreferencePatch

      # Upper bound for the watch radius, enforced server-side (the form's
      # max attribute mirrors it, but client-side limits are easy to bypass)
      # so an arbitrarily large radius can't make the watcher query expensive.
      NEARBY_WATCH_MAX_RADIUS_KM = 1000

      def self.apply
        unless UserPreference < self
          UserPreference.prepend self
          UserPreference.safe_attributes 'gtt_watch_nearby', 'gtt_watch_radius'
        end
      end

      # Plain accessors following core's UserPreference pattern: explicit
      # getter/setter pairs backed by the serialized others hash, so
      # safe_attributes mass-assignment from the My account form works.
      def gtt_watch_nearby; self[:gtt_watch_nearby]; end
      def gtt_watch_nearby=(value); self[:gtt_watch_nearby] = value; end

      def gtt_watch_radius; self[:gtt_watch_radius]; end
      def gtt_watch_radius=(value); self[:gtt_watch_radius] = value; end

      # The checkbox submits '1'/'0'; anything else counts as off.
      def gtt_watch_nearby?
        gtt_watch_nearby.to_s == '1'
      end

      # Validated radius in kilometers: a positive Integer capped at
      # NEARBY_WATCH_MAX_RADIUS_KM, or nil when the preference is unset or
      # holds a non-numeric/non-positive value.
      def gtt_watch_radius_km
        value = Integer(gtt_watch_radius.to_s, exception: false)
        value.clamp(1, NEARBY_WATCH_MAX_RADIUS_KM) if value&.positive?
      end

    end
  end
end
