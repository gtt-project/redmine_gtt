module RedmineGtt
  module Patches

    # Stores the "auto watch nearby issues" opt-in (#14) in the serialized
    # UserPreference#others hash, so no schema change is needed. The user's
    # stored location (users.geom) is the center of the watch area; the
    # radius is stored in meters (the plugin's internal unit, #10) and
    # entered/displayed in the configured display unit on My account.
    #
    # This patch only adds the preference storage and validated readers.
    # The watcher assignment itself hooks into issue creation separately.
    module UserPreferencePatch

      # Upper bound for the watch radius (1000 km), enforced server-side
      # (the form's max attribute mirrors it, but client-side limits are
      # easy to bypass) so an arbitrarily large radius can't make the
      # watcher query expensive.
      NEARBY_WATCH_MAX_RADIUS_M = 1_000_000

      def self.apply
        unless UserPreference < self
          UserPreference.prepend self
          UserPreference.safe_attributes 'gtt_watch_nearby', 'gtt_watch_radius_in_unit'
        end
      end

      # Plain accessors following core's UserPreference pattern: explicit
      # getter/setter pairs backed by the serialized others hash, so
      # safe_attributes mass-assignment from the My account form works.
      def gtt_watch_nearby; self[:gtt_watch_nearby]; end
      def gtt_watch_nearby=(value); self[:gtt_watch_nearby] = value; end

      # Raw stored radius (meters). Not mass-assignable; the account form
      # goes through gtt_watch_radius_in_unit.
      def gtt_watch_radius; self[:gtt_watch_radius]; end
      def gtt_watch_radius=(value); self[:gtt_watch_radius] = value; end

      # The checkbox submits '1'/'0'; anything else counts as off.
      def gtt_watch_nearby?
        gtt_watch_nearby.to_s == '1'
      end

      # Validated radius in meters: a positive number capped at
      # NEARBY_WATCH_MAX_RADIUS_M, or nil when the preference is unset or
      # holds a non-numeric/non-positive value.
      def gtt_watch_radius_m
        value = Float(gtt_watch_radius.to_s, exception: false)
        [value, NEARBY_WATCH_MAX_RADIUS_M].min if value&.positive?
      end

      # Form-facing virtual attribute: the radius in the configured display
      # unit. Whole numbers render without a decimal part.
      def gtt_watch_radius_in_unit
        meters = gtt_watch_radius_m
        return nil unless meters

        value = DistanceUnit.from_meters(meters)
        value == value.to_i ? value.to_i : value.round(3)
      end

      def gtt_watch_radius_in_unit=(value)
        stripped = value.to_s.strip
        self.gtt_watch_radius =
          if stripped.empty?
            nil
          elsif (number = Float(stripped, exception: false))
            DistanceUnit.to_meters(number).round.to_s
          else
            # keep the garbage; gtt_watch_radius_m rejects it as before
            stripped
          end
      end

    end
  end
end
