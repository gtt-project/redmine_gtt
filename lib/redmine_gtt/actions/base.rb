module RedmineGtt
  module Actions

    class Base

      def self.call(*args)
        new(*args).call
      end

    end

  end
end
