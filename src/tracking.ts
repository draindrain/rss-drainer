import axios from 'axios';

export interface TrackingData {
  [itemGuid: string]: number; // timestamp when posted
}

const TRACKING_FILENAME = 'rss-drainer-tracking.json';

/**
 * Tracking manager for GitHub Gist-based persistence
 */
export class TrackingManager {
  private gistId: string;
  private gistToken: string;
  private trackingData: TrackingData;

  constructor(gistId: string, gistToken: string) {
    if (!gistId || !gistToken) {
      throw new Error('GIST_ID and GIST_TOKEN are required');
    }
    this.gistId = gistId;
    this.gistToken = gistToken;
    this.trackingData = {};
  }

  /**
   * Loads tracking data from GitHub Gist
   */
  async load(): Promise<void> {
    try {
      console.log(`Loading tracking data from Gist: ${this.gistId}`);

      const response = await axios.get(
        `https://api.github.com/gists/${this.gistId}`,
        {
          headers: {
            Authorization: `token ${this.gistToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const file = response.data.files[TRACKING_FILENAME];
      if (file && file.content) {
        try {
          const parsed = JSON.parse(file.content);

          // Validate that it's an object with string keys and number values
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            console.warn('Invalid tracking data format, starting fresh');
            this.trackingData = {};
            return;
          }

          // Sanitize the data - only keep valid entries
          this.trackingData = {};
          let validCount = 0;
          let invalidCount = 0;

          for (const [key, value] of Object.entries(parsed)) {
            if (typeof key === 'string' && typeof value === 'number' && !isNaN(value)) {
              this.trackingData[key] = value;
              validCount++;
            } else {
              invalidCount++;
            }
          }

          console.log(`Loaded ${validCount} tracked items`);
          if (invalidCount > 0) {
            console.warn(`Filtered out ${invalidCount} invalid entries`);
          }
        } catch (parseError) {
          // JSON parsing failed - likely corrupted data
          console.error('Failed to parse tracking data (corrupted JSON):', parseError);
          console.warn('⚠️  Tracking data is corrupted! Starting fresh to recover...');
          console.warn('This means some items may be re-posted, but the system will recover.');
          this.trackingData = {};
        }
      } else {
        console.log('No tracking data found, starting fresh');
        this.trackingData = {};
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('Gist not found, will create on first save');
        this.trackingData = {};
      } else {
        console.error('Error loading tracking data:', error);
        throw error;
      }
    }
  }

  /**
   * Checks if an item has already been posted
   */
  isPosted(itemGuid: string): boolean {
    return itemGuid in this.trackingData;
  }

  /**
   * Marks an item as posted
   */
  markAsPosted(itemGuid: string): void {
    this.trackingData[itemGuid] = Date.now();
  }

  /**
   * Saves tracking data to GitHub Gist
   */
  async save(): Promise<void> {
    try {
      console.log(`Saving tracking data (${Object.keys(this.trackingData).length} items)`);

      const content = JSON.stringify(this.trackingData, null, 2);

      await axios.patch(
        `https://api.github.com/gists/${this.gistId}`,
        {
          files: {
            [TRACKING_FILENAME]: {
              content: content,
            },
          },
        },
        {
          headers: {
            Authorization: `token ${this.gistToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      console.log('Tracking data saved successfully');
    } catch (error) {
      console.error('Error saving tracking data:', error);
      throw error;
    }
  }

  /**
   * Cleans up old entries (older than 30 days) to prevent unlimited growth
   */
  cleanup(daysToKeep: number = 30): void {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const initialCount = Object.keys(this.trackingData).length;

    Object.keys(this.trackingData).forEach((guid) => {
      if (this.trackingData[guid] < cutoffTime) {
        delete this.trackingData[guid];
      }
    });

    const removedCount = initialCount - Object.keys(this.trackingData).length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old tracking entries`);
    }
  }
}
